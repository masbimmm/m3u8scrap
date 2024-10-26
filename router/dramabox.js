const express = require('express');
const axios = require('axios');
const funct = require('../function');
const { randStr } = require('../function');
const router = express.Router();

router.get('/', async(req, res)=>{
    // await login();
    let chapterList = [];
    for (let i = 0; i < 99; i++) {
        let searchFilm = await getFilm(i);
        if(!searchFilm.result.pageProps.__N_REDIRECT){
            if(searchFilm.result.pageProps.bookList.length==0){
                break;
            }
            if(!searchFilm.err && searchFilm.result.pageProps.bookList){
                chapterList.push(searchFilm.result.pageProps.bookList)
            }
        }
        
    }
    res.render('dramabox/index', {chapters:chapterList.flat()})
})

router.get('/:id', async (req, res) => {
    let id = req.params.id;
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://localhost/dramabox/api.php?id='+id+'&list=1',
        headers: {}
      };
      
      axios.request(config)
      .then((response) => {
        res.json({err:false, result:response.data})
      })
      .catch((error) => {
        res.json({err:true, msg:error.message})
      });
});

async function getFilm(pageNum) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://localhost/dramabox/api.php?filmList&p=' + pageNum,
        headers: {}
    };
    
    try {
        const response = await axios.request(config);
        return { err: false, result: response.data };
    } catch (error) {
        return { err: true, msg: error.message };
    }
}


module.exports = router;
