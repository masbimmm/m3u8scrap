const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs').promises; // Menggunakan fs.promises untuk operasi asinkron
const path = require('path');
const express = require('express');

const app = express();

app.use('/shortwave', require('./router/shortwave'));

app.listen(3000, ()=>{
    console.log("serv runn")
})

const data = [{"chapter_id":"6718ebe070818cb6ab0964aa","chapter_index":1,"chapter_name":"E01","is_free":1},{"chapter_id":"6718eeab12a132519acafdc8","chapter_index":2,"chapter_name":"E02","is_free":1}];

async function downloadM3U8(url) {
    const response = await axios.get(url);
    return response.data;
}

async function downloadFile(url, filename) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
    });
    await fs.writeFile(filename, response.data);
    return filename;
}

async function mergeVideos(m3u8Url, chapterIndex) {
    const m3u8Data = await downloadM3U8(m3u8Url);
    const urls = [];
    const lines = m3u8Data.split('\n');

    lines.forEach((line) => {
        if (line.startsWith('http')) {
            urls.push(line.trim());
        }
    });

    const segments = [];

    for (let i = 0; i < urls.length; i++) {
        console.log(`PROGRESS => segment_${chapterIndex}_${i}.ts`)
        const segmentPath = path.join(__dirname, `segment_${chapterIndex}_${i}.ts`);
        await downloadFile(urls[i], segmentPath);
        segments.push(segmentPath);
    }

    const listFilePath = path.join(__dirname, `video_list_${chapterIndex}.txt`);
    await fs.writeFile(listFilePath, segments.map(segment => `file '${path.basename(segment)}'`).join('\n'));

    const outputFile = path.join(__dirname, `${chapterIndex}.mp4`);
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(listFilePath)
            .inputOptions('-f', 'concat')
            .outputOptions([
                '-c', 'copy',
                '-movflags +faststart',
                '-f mp4'
            ])
            .on('end', async () => {
                console.log(`[DONE] => video ${chapterIndex}.mp4`);
                await fs.unlink(listFilePath);
                await Promise.all(segments.map(segment => fs.unlink(segment)));
                resolve(); 
            })
            .on('error', (err) => {
                console.error(`[FAIL] => video ${chapterIndex}.mp4:`, err);
                reject(err);
            })
            .save(outputFile);
    });
}
const limit = (fn, concurrency) => {
    const queue = [];
    let activeCount = 0;

    const next = async () => {
        if (queue.length === 0 || activeCount >= concurrency) return;

        activeCount++;
        const { fn: queuedFn, resolve, reject } = queue.shift();

        try {
            const result = await queuedFn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            activeCount--;
            next(); // Panggil fungsi next untuk memproses berikutnya
        }
    };

    return (fn) => {
        return new Promise((resolve, reject) => {
            queue.push({ fn, resolve, reject });
            next();
        });
    };
};

const limitedMergeVideos = limit(async (playUrl, chapterIndex) => {
    return mergeVideos(playUrl, chapterIndex);
}, 5); 

async function loadVideoList(chapterData) {
    const promises = chapterData.map(async (chapter) => {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `http://localhost/shortwave/generatechunk.php?drama_id=6707d2ed4686383c41677a27&chapter_id=${chapter.chapter_id}`,
            headers: {
                // ...
            }
        };

        try {
            const response = await axios.request(config);
            const playUrl = response.data.data.play_url;

            return limitedMergeVideos(() => mergeVideos(playUrl, chapter.chapter_index));
        } catch (error) {
            console.error('Error:', error);
        }
    });

    await Promise.all(promises);
    console.log("DONE")
}

// loadVideoList(data).catch(err => console.error('Error:', err));