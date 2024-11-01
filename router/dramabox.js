const express = require('express');
const axios = require('axios');
const funct = require('../function');
const { randStr } = require('../function');
const router = express.Router();

router.get('/', async(req, res)=>{
    let locale = 'in';
    if(req.query.locale!==undefined && req.query.locale!=null){
        locale = req.query.locale
    }
    let chapterList = [];
    for (let i = 0; i < 1000; i++) {
        let searchFilm = await getFilm(i, locale);
        if(!searchFilm.result.pageProps.__N_REDIRECT){
            if(searchFilm.result.pageProps.bookList!==undefined){
                if(searchFilm.result.pageProps.bookList.length==0){
                    break;
                }
                if(!searchFilm.err && searchFilm.result.pageProps.bookList){
                    chapterList.push(searchFilm.result.pageProps.bookList)
                }
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

async function getFilm(pageNum, locale) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://localhost/dramabox/api.php?filmList&p=' + pageNum+'&locale='+locale,
        headers: {}
    };
    try {
        const response = await axios.request(config);
        // console.log(response.data)
        return { err: false, result: response.data };
    } catch (error) {
        return { err: true, msg: error.message };
    }
}


module.exports = router;
