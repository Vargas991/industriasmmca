const cloudinary = require('cloudinary').v2;
console.log('sub_folders' in cloudinary.api);
console.log(Object.keys(cloudinary.api).filter(k => k.includes('sub')));
