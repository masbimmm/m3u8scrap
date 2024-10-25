const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.render('index');
})

app.use('/shortwave', require('./router/shortwave'));

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

io.on('connection', (socket) => {
    const dataddd = [
        {"chapter_id":"6718ebe070818cb6ab0964aa","chapter_index":1,"chapter_name":"E01","is_free":1},
        {"chapter_id":"6718eeab12a132519acafdc8","chapter_index":2,"chapter_name":"E02","is_free":1}
    ];

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

    async function mergeVideos(m3u8Url, chapterIndex, channel, namaFilm, filmId) {
        const dirPath = path.join(__dirname, channel);
        ensureDirectoryExists(dirPath);
        const savedirPath = path.join(dirPath, namaFilm);
        ensureDirectoryExists(savedirPath);
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
            socket.emit('progres', {filmId:filmId, msg:`PROGRESS => segment_${chapterIndex}_${i}.ts`})
            console.log('progres', {filmId:filmId, msg:`PROGRESS => segment_${chapterIndex}_${i}.ts`})
            const segmentPath = path.join(savedirPath, `segment_${chapterIndex}_${i}.ts`);
            await downloadFile(urls[i], segmentPath);
            segments.push(segmentPath);
        }

        const listFilePath = path.join(savedirPath, `video_list_${chapterIndex}.txt`);
        await fs.writeFile(listFilePath, segments.map(segment => `file '${path.basename(segment)}'`).join('\n'));

        const outputFile = path.join(savedirPath, `${chapterIndex}.mp4`);
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
                    socket.emit('done', {filmId:filmId, msg:`[DONE] => video ${chapterIndex}.mp4`})
                    await fs.unlink(listFilePath);
                    await Promise.all(segments.map(segment => fs.unlink(segment)));
                    resolve(); 
                })
                .on('error', (err) => {
                    socket.emit('fail', {filmId:filmId, msg:`[FAIL] => video ${chapterIndex}.mp4`}, err)
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
                next();
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

    async function loadVideoList(filmId, chapterData, channel, namaFilm) {
        if(channel=='shortwave'){
            chapterData = chapterData.result;
        }
        console.log(chapterData)
        const promises = chapterData.map(async (chapter) => {
            console.log(chapter.chapter_id)
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `http://localhost/shortwave/generatechunk.php?drama_id=${filmId}&chapter_id=${chapter.chapter_id}`,
                headers: {
                }
            };

            try {
                const response = await axios.request(config);
                const playUrl = response.data.data.play_url;

                return limitedMergeVideos(() => mergeVideos(playUrl, chapter.chapter_index, channel, namaFilm, filmId));
            } catch (error) {
                console.error('Error:', error);
            }
        });

        await Promise.all(promises);
        console.log("DONE")
    }

    socket.on('download', (data) => {
        if (!data.err) {
            if (data.channel == 'shortwave') {
                loadVideoList(data.filmId, data.data, data.channel, data.namaFilm).catch(err => console.error('Error:', err));
            }
        }
    })
});

async function ensureDirectoryExists(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
        console.error('Error creating directory:', err);
    }
}