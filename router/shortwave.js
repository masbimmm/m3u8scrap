const express = require('express');
const axios = require('axios');
const funct = require('../function');
const { randStr } = require('../function');
const router = express.Router();



router.get('/', async(req, res)=>{
    // await login();
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://localhost/shortwave/api.php?filmList',
        headers: {}
      };
      
      axios.request(config)
      .then((response) => {
        var data = response.data;
        if(data.err){
            res.json({err:true, result:data});
        }else{
            // console.log(data)
            res.render('shortwave/index', {chapters:data.data});
        }
      })
      .catch((error) => {
        res.json({err:true, msg:error.message})
      });
})

router.get('/:id', async (req, res) => {
    let id = req.params.id;
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://localhost/shortwave/api.php?drama_id='+id+'&list=1',
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
      url: 'http://localhost/shortwave/api.php?drama_id='+id+'&chapter_id='+cid,
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
module.exports = router;
