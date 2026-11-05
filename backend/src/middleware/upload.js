const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueSuffix);
  }
});

function fileFilter(req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Csak képfájlok engedélyezettek'), false);
  }
}

const upload = multer({ storage, fileFilter });

module.exports = upload;
