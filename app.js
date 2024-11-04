const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const vttToSrt = require('vtt-to-srt');

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
app.use('/dramabox', require('./router/dramabox'));
app.use('/serealPlus', require('./router/serealPlus'));

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

io.on('connection', (socket) => {
    let successCount = 0; 
    let failCount = 0;

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
    
    async function downloadOneVideo(url, chapterIndex, channel, namaFilm, filmId) {
        let no = 0;
        const dirPath = path.join(__dirname, channel);
        ensureDirectoryExists(dirPath);
        const savedirPath = path.join(dirPath, namaFilm);
        ensureDirectoryExists(savedirPath);
        const filePath = path.join(savedirPath, `${chapterIndex}.mp4`);
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
        });
        socket.emit('progres', {filmId:filmId, msg:`PROGRESS => segment_${chapterIndex}.mp4`, count:successCount})
        await fs.writeFile(filePath, response.data);
        successCount++;
        return chapterIndex;
    }

    async function convertVttToSrt(vttPath, srtPath) {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(vttPath)  // Input file VTT
                .output(srtPath)  // Output file SRT
                .outputOptions('-c:s srt')  // Menentukan codec subtitle
                .on('end', () => {
                    console.log('Conversion finished successfully!');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error during conversion:', err);
                    reject(err);
                })
                .run();  // Menjalankan konversi
        });
    }

    async function mergeVideos(m3u8Url, chapterIndex, channel, namaFilm, filmId, vttUrl) {
        let no = 0;
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
            socket.emit('progres', {filmId:filmId, msg:`PROGRESS => segment_${chapterIndex}_${i}.ts`, count:successCount})
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
                    successCount++;
                    socket.emit('done', {filmId:filmId, msg:`[DONE] => video ${chapterIndex}.mp4`, count:successCount})
                    await fs.unlink(listFilePath);
                    await Promise.all(segments.map(segment => fs.unlink(segment)));
                    resolve(); 
                })
                .on('error', (err) => {
                    failCount++;
                    socket.emit('fail', {filmId:filmId, msg:`[FAIL] => video ${chapterIndex}.mp4`, count:successCount}, err)
                    console.error(`[FAIL] => video ${chapterIndex}.mp4:`, err);
                    reject(err);
                })
                .save(outputFile);
        });
    }
    async function mergeVtt(m3u8Url, chapterIndex, channel, namaFilm, filmId, vttUrl) {
        let no = 0;
        const dirPath = path.join(__dirname, channel);
        ensureDirectoryExists(dirPath);
        const savedirPath = path.join(dirPath, namaFilm);
        ensureDirectoryExists(savedirPath);

        const vttPath = path.join(savedirPath, `${chapterIndex}.vtt`);
        await downloadFile(vttUrl, vttPath); 
        const srtPath = path.join(savedirPath, `${chapterIndex}.srt`);
        await convertVttToSrt(vttPath, srtPath)

        const filePath = path.join(savedirPath, `${chapterIndex}.mp4`);
        const outputPath = path.join(savedirPath, `final_${chapterIndex}.mp4`);
        return new Promise((resolve, reject) => {
            ffmpeg(filePath)
            .outputOptions([
                `-vf subtitles=${srtPath}`
            ])
            .on('end', () => {
                console.log('Proses penggabungan selesai!');
            })
            .on('error', (err) => {
                console.error('Terjadi kesalahan: ' + err.message);
            })
            .save(outputPath);
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
        if(channel=='serealPlus'){
            const promises = [];

            for (let i = 0; i < chapterData.length; i++) { // Ubah indeks dari 1-based menjadi 0-based
                let config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `http://localhost/sereal+/api.php?filmId=${filmId}&cid=${chapterData[i].id}`,
                    headers: {}
                };
                promises.push(
                    axios.request(config)
                        .then(response => {
                            if (response.data && 
                                response.data.chunk && 
                                response.data.chunk.data && 
                                typeof response.data.chunk.data.curr !== 'undefined') {
                                
                                let rez = response.data.chunk.data.curr;
                                return limitedMergeVideos(() => downloadOneVideo(rez.playerUrlInfo, rez.sequenceNo, channel, namaFilm, filmId));
                            } else {
                                console.log("Sequence no " + chapterData[i].sequenceNo, response.data);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        })
                );
                // try {
                //     const response = await axios.request(config); // Tunggu sampai permintaan selesai
                //     // console.log(response.data.chunk.data);
                //     if (response.data && 
                //         response.data.chunk && 
                //         response.data.chunk.data && 
                //         typeof response.data.chunk.data.curr !== 'undefined') {
                        
                //         let rez = response.data.chunk.data.curr;
                //         return limitedMergeVideos(() => downloadOneVideo(rez.playerUrlInfo, rez.sequenceNo, channel, namaFilm, filmId));
                //     } else {
                //         console.log("Sequence no " + chapterData[i].sequenceNo, response.data);
                //     }
                //     // console.log(chapterData[i].sequenceNo)
                // } catch (error) {
                //     console.error('Error:', error);
                // }
            }
            
            await Promise.all(promises);
            socket.emit('done', {filmId:filmId, msg:`[DONE] => video ${namaFilm}`, count:successCount})
        }
        if(channel=='shortwave'){
            chapterData = chapterData.result;
            const promises = chapterData.map(async (chapter) => {
                let config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `http://localhost/shortwave/api.php?drama_id=${filmId}&chapter_id=${chapter.chapter_id}`,
                    headers: {
                    }
                };
    
                try {
                    const response = await axios.request(config);
                    const vtt = response.data.data.sublist[0].url;
                    const playUrl = response.data.data.play_url;
                    // return limitedMergeVideos(() => mergeVideos(playUrl, chapter.chapter_index, channel, namaFilm, filmId, vtt));
                    return limitedMergeVideos(() => mergeVtt(playUrl, chapter.chapter_index, channel, namaFilm, filmId, vtt));
                } catch (error) {
                    console.error('Error:', error);
                }
            });
            await Promise.all(promises);
        }

        if(channel=='dramabox'){
            const promises = []; // Buat array untuk menyimpan promise

            for (let i = 1; i <= chapterData.result.film.chapterCount; i++) {
                let config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `http://localhost/dramabox/api.php?id=${filmId}&episode=${i}`,
                    headers: {}
                };
            
                // Tambahkan promise ke dalam array
                promises.push(
                    axios.request(config)
                        .then(response => {
                            const playUrl = response.data.play_url;
                            return limitedMergeVideos(() => downloadOneVideo(playUrl, i, channel, namaFilm, filmId));
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        })
                );
            }
            
            // Tunggu semua promise selesai
            await Promise.all(promises);
            
            socket.emit('done', {filmId:filmId, msg:`[DONE] => video ${namaFilm}`, count:successCount})
        }
        

        successCount = 0; 
        failCount = 0;
    }

    socket.on('download', (data) => {
        if (!data.err) {
            if (data.channel == 'shortwave') {
                loadVideoList(data.filmId, data.data, data.channel, data.namaFilm.replace(/[^a-zA-Z0-9 ]+/g, '')).catch(err => console.error('Error:', err));
            }
            if (data.channel == 'dramabox') {
                loadVideoList(data.filmId, data.data, data.channel, data.namaFilm.replace(/[^a-zA-Z0-9 ]+/g, '')).catch(err => console.error('Error:', err));
            }
            if(data.channel == 'serealPlus'){
                // console.log(data)
                if(!data.data.err && data.data.result.data && data.data.result.data.records){
                    const result = data.data.result.data.records.map(item => ({
                        id: item.id,
                        sequenceNo: item.sequenceNo
                    }));
                    socket.emit('chapterCount', {filmId:data.filmId, count:result.length})
                    loadVideoList(data.filmId, result, data.channel, data.namaFilm.replace(/[^a-zA-Z0-9 ]+/g, '')).catch(err => console.error('Error:', err));
                }
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