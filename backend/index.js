const fileUpload = require("express-fileupload");
const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
var __dirname = path.resolve();

const app = express();
const PORT = process.env.PORT || 5000;

const { exec } = require("child_process");

app.use(fileUpload());
app.use(cors());
app.use(express.json());

app.use(express.static("./video"));

// Uploading the files
app.post("/send-file", (req, res) => {
  console.log(req.body);
  if (req.files === null) {
    return res.json({ msg: "Please upload a file!" });
  }

  const file = req.files.file;
  fs.remove(`${__dirname}/video/HLS`, () => {
    fs.mkdirSync(`${__dirname}/video/HLS`);
    fs.remove(`${__dirname}/video/uploaded`, () => {
      fs.mkdirSync(`${__dirname}/video/uploaded`);

      file.mv(`${__dirname}/video/uploaded/${file.name}`, (error) => {
        if (error) {
          console.error(err);
          return res.send(err);
        }

        exec(
          `cd video && cd HLS && ffmpeg -i ${__dirname}/video/uploaded/${file.name} -codec: copy -start_number 0 -hls_time 10 -hls_list_size 0 -f hls ${file.name}.m3u8`,
          (error, stdout, stderr) => {
            if (error) {
              console.log(
                `Error: ${error}`
              );
              return;
            } else if (stderr) {
              console.log(`Error: ${stderr}`);
            } else {
              console.log(stdout);
            }
          }
        );

        fs.readdirSync(`${__dirname}/video/HLS`);

        res.json({ fileName: file.name, filePath: `/uploaded/${file.name}` });
      });
    });
  });

  app.get("/get-files", (req, res) => {
    fs.readdir(
      `${__dirname}/video/HLS`,
      { withFileTypes: true },
      (err, files) => {
        if (err) {
          console.log(err);
        } else {
          res.send(
            files.map((file) => {
              return {
                fileName: file.name,
                isFolder: file.isDirectory(),
              };
            })
          );

        }
      }
    );
  });
});

app.listen(PORT, () => {
  console.log(`🎉 Server is running on PORT: ${PORT}`);
});
