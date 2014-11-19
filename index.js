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
			res.render("post", {entry:data});
		});
		
	});

app.get('/', function (req,res) 
	{
		res.render("index", {posts:blog.getPosts(0,2)});
	});

var server = app.listen(config.port, function()
{
	console.info("ezBlog started");
});