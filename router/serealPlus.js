const express = require('express');
const axios = require('axios');
const funct = require('../function');
const { randStr } = require('../function');
const router = express.Router();

router.get('/', async(req, res)=>{
    let locale = 'id';
    if(req.query.locale!==undefined && req.query.locale!=null){
        locale = req.query.locale
    }
    let searchFilm = await getFilm(locale);
    if(searchFilm.result.data.records){
        searchFilm = searchFilm.result.data.records;
        return res.render('sereal+/index', {chapters:searchFilm})
    }else{
        return res.json({searchFilm})
    }
})

router.get('/:id', async (req, res) => {
    let id = req.params.id;
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://localhost/sereal+/api.php?filmId='+id+'',
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

router.get('/:id/:cid', async (req, res) => {
    let id = req.params.id;
    let cid = req.params.cid;
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://localhost/sereal+/api.php?filmId='+id+'&cid='+cid,
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

async function getFilm(locale) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://localhost/sereal+/api.php?random='+Date.now()+'&getFilmList&locale='+locale,
        headers: {
        Host: 'video-api.serealplus.com'
        // 'ua: Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        }
    };
    try {
        const response = await axios.request(config);
        return { err: false, result: response.data };
    } catch (error) {
        return { err: true, msg: error.message };
    }
}


module.exports = router;
