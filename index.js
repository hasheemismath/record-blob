const bodyParser = require("body-parser")
const multer = require('multer')
const formidable = require('formidable');
const express = require('express');
const path = require('path');
const { google } = require("googleapis");
var fs = require('fs');
 const publicPath = path.join(__dirname, './public');
const OAuth2Data = require("./credentials.json");

const FormData = require('form-data');
const axios = require('axios');
var http = require('http');

const accessToken = "9d73e504bbe7c9c8a00b3744cf708e9bef3d953d2df8dd7d7547fb786a32645e";
const folderId = "NDNfMTQ3MDE4Nl9vQmlOWA";
const sessionId = "9d73e504bbe7c9c8a00b3744cf708e9bef3d953d2df8dd7d7547fb786a32645e";

global.filepath = undefined;

const port = process.env.PORT || 3000;
var app = express();

app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({
    extended:true
}))

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));






var storage = multer.diskStorage({


    destination: './uploads/',
    filename: function ( req, file, cb ) {

        // cb( null, file.originalname+ '-' + Date.now()+".mp4");
        cb( null,  Date.now()+file.originalname);
    }

    // destination: function (request, file, callback){
    //     // callback(null, './uploads' + '-' + Date.now() + path.extname(file.originalname))
    //     callback(null, './uploads');
    // },
    // filename: function(request, file, callback){
    //     console.log(file);
    //     callback(null, file.originalname)
    // }
});



var upload = multer({storage: storage}).single('videoFile');

app.post('/upload',(req,res)=>{



    upload(req, res, function(err) {
        console.log('File is',req.file)
        req.file.originalname='blobdasda'
        if(err) {
            console.log('Error Occured');
            return;
        }
         // console.log(req.file);
        console.log('Video Uploaded');
        res.status(200).json({
            success:'Your file Uploaded'
        })

    })



    // console.log(req.body.name)
    //
    // res.status(200).json({
    //     success:'File has been saved',
    //     name:req.body.name
    // })
})

app.post('/test',(req,res)=>{

    upload(req, res, function(err) {
        console.log('File is',req.file)

        if(err) {
            console.log('Error Occured');
            return;
        }
        // console.log(req.file);
        console.log('Video Uploaded');
        global.filepath = req.file.path.toString();
        uploadToOD();
        res.status(200).json({
            success:'Your file Uploaded'
        })

    })

})


uploadToOD = async () => {
    console.log('Upload sucess')
    const file = fs.createReadStream(global.filepath);
    const fileName = new Date().getTime() + path.extname(file.path);



    try {
        const newFile = await createFile(fileName);

         await uploadChunks(file, newFile.data.FileId, file.bytesRead, newFile.data.TempLocation);
    } catch (e) {
        console.log('errror', e);
    }
}

createFile = (fileName) => {

    var config = {
        method: 'post',
        url: 'https://dev.opendrive.com/api/v1/upload/create_file.json',
        headers: {
            'Content-Type': 'application/json'
        },
        data : {
            'session_id': sessionId,
            'folder_id': folderId,
            'file_name': fileName
        }
    };



     return axios(config);

}

uploadChunks = (file, fileId, fileSize, tempLocation) => {



    var form = new FormData();
     form.append('session_id', sessionId);
    form.append('file_id', fileId);
    form.append('chunk_offset', '0');
    form.append('chunk_size', fileSize);
    form.append('temp_location', tempLocation);
    form.append('file_data', file);

      console.log()

    axios({
        method: 'post',
        url: 'https://dev.opendrive.com/api/v1/upload/upload_file_chunk.json?session_id='+ sessionId,
        data: {
            'session_id': sessionId,
            'file_id': fileId,
            'chunk_offset': '0',
            'chunk_size': 1,
            'temp_location': tempLocation,
            'file_data': file
        }

    }).then(function (res){
        console.log('sucess');
    })
        .catch(function (error){
             console.log(error.response)
        })

    // var request = http.request({
    //     method: 'post',
    //     url: 'https://dev.opendrive.com/api/v1/upload/upload_file_chunk.json',
    //     headers: form.getHeaders()
    // });

    // var request = {
    //     method: 'post',
    //     url: 'https://dev.opendrive.com/api/v1/upload/upload_file_chunk.json',
    //     headers: form.getHeaders()
    // };



    // request.writable = true;
    // form.pipe(request);

    // console.log(request)

    // request.on('response', function(res) {
    //     console.log(res.statusCode);
    //     // closeUpload(fileId, fileSize, tempLocation);
    // });

}




app.listen(port,()=>{
    console.log(`Server up and running on port ${port}`)
})