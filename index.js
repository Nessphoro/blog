var config = require("./settings");
var blog = require("./blogWorker");
var express = require('express');
var app = express();

if(config.proxy)
{
	app.enable('trust proxy');
}
else
{
	app.use(express.static(__dirname + '/public'));
}

blog.init(config);
app.set("view engine", "jade")
app.engine('jade', require('jade').__express);

app.get('/blog/:name', function (req, res)
	{
		blog.getPost(req.params.name, function (err,data)
		{
			res.render("post", {entry:data, title:data.post.title,menu:[
			{url:"/",text:"Blog", active:true},
			{url:"/resume",text:"Resume"},
			{url:"/contact",text:"Contact"}
			]});
		});
		 
	});

app.get('/', function (req,res) 
	{
		res.render("index", {posts:blog.getPosts(0,10), title:"Blog",menu:[
			{url:"/",text:"Blog", active:true},
			{url:"/resume",text:"Resume"},
			{url:"/contact",text:"Contact"}
			]});
	});


app.get('/resume', function (req,res) 
	{
		res.render("resume", {title:"Resume", menu:[
			{url:"/",text:"Blog"},
			{url:"/resume",text:"Resume", active:true},
			{url:"/contact",text:"Contact"}
			]});
	});

app.get('/contact', function (req,res) 
	{
		res.render("contact", {title:"Resume", menu:[
			{url:"/",text:"Blog"},
			{url:"/resume",text:"Resume"},
			{url:"/contact",text:"Contact", active:true}
			]});
	});

var server = app.listen(config.port, function()
{
	console.info("ezBlog started");
});