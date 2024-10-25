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


// router.get('/:id/:chapterid', async (req, res) => {
//     await login();
//     let id = req.params.id;
//     let chapterid = req.params.chapterid;
//     let config = {
//         method: 'get',
//         maxBodyLength: Infinity,
//         url: 'https://api.shortswave.com/v1/drama/chapter/detail?drama_id='+id+'&chapter_id='+chapterid+'&auto_pay=1',
//         headers: headers
//       };
      
//       axios.request(config)
//       .then((response) => {
//         res.json({err:false, result:response.data})
//       })
//       .catch((error) => {
//         res.json({err:true, msg:error.message})
//       });
// });

// async function login() {
//     let data = JSON.stringify({
//         "device_type": "Unk",
//         "attribution_type": "af",
//         "attribution_id": funct.randNum(13) + "-" + funct.randNum(7)
//     });

//     let config = {
//         method: 'post',
//         maxBodyLength: Infinity,
//         url: 'https://api.shortswave.com/login/anonymous',
//         headers: { 
//             'app': 'com.company.shortsdrama.wave', 
//             'Device-UUid': '' + randStr(8).toUpperCase() + '-' + randStr(4).toUpperCase() + '-' + randStr(4).toUpperCase() + '-' + randStr(4).toUpperCase() + '-' + randStr(12).toUpperCase() + '+' + randStr(32).toUpperCase(), 
//             'Content-Type': 'application/json'
//         },
//         data: data
//     };

//     try {
//         const response = await axios.request(config);
        
//         if (response.data && response.data.code === 0) {
//             let result = response.data.data;
//             headers = config.headers
//             headers['X-SESSION-TOKEN'] = result.session_token; // Store the session token in headers
//             await taskReward('1001');
//             await taskReward('1002');
//             await taskReward('1003');
//             return { err: false, res: response.data }; // Return the successful response
//         } else {
//             return { err: true, msg: 'Unexpected response code' };
//         }
//     } catch (error) {
//         return { err: true, msg: error.message }; // Return the error message
//     }
// }


// async function taskReward(taskId){
//     let data = JSON.stringify({
//         "task_id": taskId
//     });

//     let config = {
//         method: 'post',
//         maxBodyLength: Infinity,
//         url: 'https://api.shortswave.com/task/submit',
//         headers: headers,
//         data : data
//     };
//     let rez = {
//         taskId:taskId
//     }
//     axios.request(config).then((response) => {
//         rez.data = response.data;
//         console.log(JSON.stringify(rez));
//     }).catch((error) => {
//         console.log(error);
//     });
// }

module.exports = router;
