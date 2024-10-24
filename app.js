const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs').promises; // Menggunakan fs.promises untuk operasi asinkron
const path = require('path');

const data = [{"chapter_id":"671079c8674d6c94f2ec5e88","chapter_index":1,"chapter_name":"E01","is_free":1},{"chapter_id":"67107a841e2658d46819306c","chapter_index":2,"chapter_name":"E02","is_free":1},{"chapter_id":"67107b2da1bcd12216ac9214","chapter_index":3,"chapter_name":"E03","is_free":1},{"chapter_id":"67107be8e531e043ba4964a7","chapter_index":4,"chapter_name":"E04","is_free":1},{"chapter_id":"67107c02e531e043ba4964b2","chapter_index":5,"chapter_name":"E05","is_free":1},{"chapter_id":"67107c05e531e043ba4964b4","chapter_index":6,"chapter_name":"E06","is_free":1},{"chapter_id":"67107c91f34b1ef9b8c23bea","chapter_index":7,"chapter_name":"E07","is_free":1},{"chapter_id":"67107c93f34b1ef9b8c23beb","chapter_index":8,"chapter_name":"E08","is_free":1},{"chapter_id":"67107c95f34b1ef9b8c23bec","chapter_index":9,"chapter_name":"E09","is_free":1},{"chapter_id":"671079c4674d6c94f2ec5e87","chapter_index":10,"chapter_name":"E10","is_free":1},{"chapter_id":"671079cb674d6c94f2ec5e89","chapter_index":11,"chapter_name":"E11","is_free":1},{"chapter_id":"671079cd674d6c94f2ec5e8a","chapter_index":12,"chapter_name":"E12","is_free":1},{"chapter_id":"67107a731e2658d468193065","chapter_index":13,"chapter_name":"E13","is_free":0},{"chapter_id":"67107a751e2658d468193066","chapter_index":14,"chapter_name":"E14","is_free":0},{"chapter_id":"67107a771e2658d468193067","chapter_index":15,"chapter_name":"E15","is_free":0},{"chapter_id":"67107a7a1e2658d468193068","chapter_index":16,"chapter_name":"E16","is_free":0},{"chapter_id":"67107a7d1e2658d468193069","chapter_index":17,"chapter_name":"E17","is_free":0},{"chapter_id":"67107a7f1e2658d46819306a","chapter_index":18,"chapter_name":"E18","is_free":0},{"chapter_id":"67107a811e2658d46819306b","chapter_index":19,"chapter_name":"E19","is_free":0},{"chapter_id":"67107a861e2658d46819306d","chapter_index":20,"chapter_name":"E20","is_free":0},{"chapter_id":"67107a8a1e2658d46819306e","chapter_index":21,"chapter_name":"E21","is_free":0},{"chapter_id":"67107a8c1e2658d46819306f","chapter_index":22,"chapter_name":"E22","is_free":0},{"chapter_id":"67107a8f1e2658d468193070","chapter_index":23,"chapter_name":"E23","is_free":0},{"chapter_id":"67107a911e2658d468193071","chapter_index":24,"chapter_name":"E24","is_free":0},{"chapter_id":"67107a941e2658d468193072","chapter_index":25,"chapter_name":"E25","is_free":0},{"chapter_id":"67107a961e2658d468193073","chapter_index":26,"chapter_name":"E26","is_free":0},{"chapter_id":"67107b28a1bcd12216ac9212","chapter_index":27,"chapter_name":"E27","is_free":0},{"chapter_id":"67107a991e2658d468193074","chapter_index":28,"chapter_name":"E28","is_free":0},{"chapter_id":"67107b2aa1bcd12216ac9213","chapter_index":29,"chapter_name":"E29","is_free":0},{"chapter_id":"67107b2fa1bcd12216ac9215","chapter_index":30,"chapter_name":"E30","is_free":0},{"chapter_id":"67107b32a1bcd12216ac9216","chapter_index":31,"chapter_name":"E31","is_free":0},{"chapter_id":"67107b34a1bcd12216ac9217","chapter_index":32,"chapter_name":"E32","is_free":0},{"chapter_id":"67107b37a1bcd12216ac9218","chapter_index":33,"chapter_name":"E33","is_free":0},{"chapter_id":"67107b39a1bcd12216ac9219","chapter_index":34,"chapter_name":"E34","is_free":0},{"chapter_id":"67107b3ca1bcd12216ac921a","chapter_index":35,"chapter_name":"E35","is_free":0},{"chapter_id":"67107bdfe531e043ba4964a3","chapter_index":36,"chapter_name":"E36","is_free":0},{"chapter_id":"67107be1e531e043ba4964a4","chapter_index":37,"chapter_name":"E37","is_free":0},{"chapter_id":"67107be4e531e043ba4964a5","chapter_index":38,"chapter_name":"E38","is_free":0},{"chapter_id":"67107be6e531e043ba4964a6","chapter_index":39,"chapter_name":"E39","is_free":0},{"chapter_id":"67107beae531e043ba4964a8","chapter_index":40,"chapter_name":"E40","is_free":0},{"chapter_id":"67107bede531e043ba4964a9","chapter_index":41,"chapter_name":"E41","is_free":0},{"chapter_id":"67107befe531e043ba4964aa","chapter_index":42,"chapter_name":"E42","is_free":0},{"chapter_id":"67107bf1e531e043ba4964ab","chapter_index":43,"chapter_name":"E43","is_free":0},{"chapter_id":"67107bf4e531e043ba4964ac","chapter_index":44,"chapter_name":"E44","is_free":0},{"chapter_id":"67107bf7e531e043ba4964ad","chapter_index":45,"chapter_name":"E45","is_free":0},{"chapter_id":"67107bf9e531e043ba4964ae","chapter_index":46,"chapter_name":"E46","is_free":0},{"chapter_id":"67107bfbe531e043ba4964af","chapter_index":47,"chapter_name":"E47","is_free":0},{"chapter_id":"67107bfde531e043ba4964b0","chapter_index":48,"chapter_name":"E48","is_free":0},{"chapter_id":"67107c00e531e043ba4964b1","chapter_index":49,"chapter_name":"E49","is_free":0},{"chapter_id":"6710893c4e4894b50027b3fd","chapter_index":50,"chapter_name":"E50","is_free":0},{"chapter_id":"6710893a4e4894b50027b3fc","chapter_index":51,"chapter_name":"E51","is_free":0},{"chapter_id":"671089ff4cfc123552f0d4e0","chapter_index":52,"chapter_name":"E52","is_free":0},{"chapter_id":"6710893d4e4894b50027b3fe","chapter_index":53,"chapter_name":"E53","is_free":0},{"chapter_id":"67107c03e531e043ba4964b3","chapter_index":54,"chapter_name":"E54","is_free":0},{"chapter_id":"67108a004cfc123552f0d4e1","chapter_index":55,"chapter_name":"E55","is_free":0},{"chapter_id":"67108a014cfc123552f0d4e2","chapter_index":56,"chapter_name":"E56","is_free":0},{"chapter_id":"67108a034cfc123552f0d4e3","chapter_index":57,"chapter_name":"E57","is_free":0},{"chapter_id":"67108a044cfc123552f0d4e4","chapter_index":58,"chapter_name":"E58","is_free":0},{"chapter_id":"67108a054cfc123552f0d4e5","chapter_index":59,"chapter_name":"E59","is_free":0},{"chapter_id":"67108a064cfc123552f0d4e6","chapter_index":60,"chapter_name":"E60","is_free":0},{"chapter_id":"67108a074cfc123552f0d4e7","chapter_index":61,"chapter_name":"E61","is_free":0},{"chapter_id":"67108a084cfc123552f0d4e8","chapter_index":62,"chapter_name":"E62","is_free":0},{"chapter_id":"67108a094cfc123552f0d4e9","chapter_index":63,"chapter_name":"E63","is_free":0},{"chapter_id":"67108a0a4cfc123552f0d4ea","chapter_index":64,"chapter_name":"E64","is_free":0},{"chapter_id":"67108a0c4cfc123552f0d4eb","chapter_index":65,"chapter_name":"E65","is_free":0},{"chapter_id":"67108a0d4cfc123552f0d4ec","chapter_index":66,"chapter_name":"E66","is_free":0},{"chapter_id":"67108a0e4cfc123552f0d4ed","chapter_index":67,"chapter_name":"E67","is_free":0},{"chapter_id":"67108a104cfc123552f0d4ee","chapter_index":68,"chapter_name":"E68","is_free":0},{"chapter_id":"67108a114cfc123552f0d4ef","chapter_index":69,"chapter_name":"E69","is_free":0},{"chapter_id":"67108a124cfc123552f0d4f0","chapter_index":70,"chapter_name":"E70","is_free":0},{"chapter_id":"67108ab74fd35168d82241fa","chapter_index":71,"chapter_name":"E71","is_free":0},{"chapter_id":"67108ab84fd35168d82241fb","chapter_index":72,"chapter_name":"E72","is_free":0},{"chapter_id":"67108aba4fd35168d82241fc","chapter_index":73,"chapter_name":"E73","is_free":0},{"chapter_id":"67108abb4fd35168d82241fd","chapter_index":74,"chapter_name":"E74","is_free":0},{"chapter_id":"67108abc4fd35168d82241fe","chapter_index":75,"chapter_name":"E75","is_free":0}];

async function downloadM3U8(url) {
    const response = await axios.get(url);
    return response.data;
}

async function downloadFile(url, filename) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
    });
    await fs.writeFile(filename, response.data); // Menggunakan fs.promises.writeFile
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
                console.log(`Proses penggabungan selesai untuk ${chapterIndex}.mp4`);
                await fs.unlink(listFilePath); // Menghapus file daftar
                await Promise.all(segments.map(segment => fs.unlink(segment))); // Menghapus segmen setelah digabung
                resolve(); // Menyelesaikan promise
            })
            .on('error', (err) => {
                console.error(`Error saat menggabungkan ${chapterIndex}.mp4:`, err);
                reject(err); // Menolak promise
            })
            .save(outputFile);
    });
}

async function loadVideoList(chapterData) {
    for (const chapter of chapterData) {
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
            await mergeVideos(playUrl, chapter.chapter_index);
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

loadVideoList(data).catch(err => console.error('Error:', err));