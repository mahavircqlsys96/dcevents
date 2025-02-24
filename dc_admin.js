var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser')
var fileUpload = require('express-fileupload')
let session = require('express-session');
const flash = require('express-flash');
var app = express();
var layouts = require('express-ejs-layouts');

const socketIo = require('socket.io');
const server = require('http').createServer(app); 
require('dotenv').config()
const port=process.env.PORT2
let io = socketIo(server); 
// var indexRouter = require('./routes/vender');
var adminRouter = require('./routes/admin');
// var apiRouter = require('./routes/ApiRoutes')(io)

require('./socket/socket')(io)
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(layouts)
app.set('layout','Admin/layout')
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(fileUpload());
app.use(flash());
app.use(session({ secret: 'session22' }));

app.use('/', adminRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

server.listen(port,(req,res)=>{
  console.log(`Your server start with port ${port}`);
})
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
