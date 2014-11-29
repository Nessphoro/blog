//Takes care of everything related to working with the blog's markdown file
var LRU = require("lru-cache");
var fs = require("fs");
var md = require("markdown").markdown;


var cache; //Used to render blog entries
var lookup;
var orderList; //Stores the correct order of blog entries

module.exports.getPosts = function(start, count)
{
	return orderList.slice(start,start+count);
};

module.exports.getPost = function(id, callback)
{
	var entry = {post: lookup[id], html: undefined};
	if(entry.post != null)
	{
		entry.html = cache.get(id);

		if(entry.html === undefined)
		{
			//It was purged
			fs.readFile(entry.post.location, "utf8", function (err,data)
			{
				console.log(err);
				if(err)
					callback(err,entry); //too bad
				else
				{

					var tree=md.parse(data);
					var renderTree = ['markdown']
					for(var index=1; index<tree.length;index++)
					{
						if(tree[index][1]!="<cut>" && tree[index][1]!="</cut>")
						{
							renderTree.push(tree[index]);
						}
					}
					var html = md.renderJsonML(md.toHTMLTree(renderTree));
					cache.set(id, html);
					entry.html = html;
					callback(null,entry);
				}
			});
		}
		else
			callback(null,entry);
	}
	else
		return callback(null,entry);
};

module.exports.init = function(settings)
{
	cache = LRU({max:settings.cacheSizeMiB * 1024 * 1024, length: function(entry)
		{
			return entry.length;
		}})

	//
	console.log("Doing initial scan");
	orderList = new Array();
	lookup=new Object();
	var initialFiles = fs.readdirSync(settings.location);

	initialFiles.forEach(function (file)
	{
		//check if MD
		if(file.match(".md$"))
		{
			if(settings.logging == 'dev')
			{
				console.log("Processing: " + file);
			}

			var raw = fs.readFileSync(settings.location + file, "utf8");
			var stats = fs.lstatSync(settings.location + file);
			var tree = md.parse(raw);

			if(tree[1][0] != "header" || tree[1][1].level != 1)
			{
				if(settings.logging == 'dev')
				{
					console.error("Malformatted Markdown! Skipping file");
				}
				return;
			}

			var header = tree[1][2]; //Save the title
			var previewTree=["markdown"];
			if(tree[2][1] != "<cut>")
			{
			  	if(settings.logging == 'dev')
				{
					console.error("Malformatted Markdown! Skipping file");
				}
				return;
			}
			var searchIndex = 3;
			while(true)
			{
				if(tree[searchIndex][1] != "</cut>")
				{
					previewTree.push(tree[searchIndex]);
					searchIndex++;
				}
				else
					break;
			}
			console.log(tree);
			var vid = file.substr(0,file.length-3)
			lookup[vid] = {id:vid,title:header,location:settings.location + file, preview:md.renderJsonML(md.toHTMLTree(previewTree)), posted: new Date(stats.ctime)};
			orderList.push(lookup[vid]);
			
		}
	});

	orderList.sort(function (a,b)
	{
		if(a.posted < b.posted)
		{
			return 1
		}
		else 
			return -1;
	});

	console.log(orderList);


	fs.watch(settings.location,function (filename, event)
	{

		//We gon' have to rebuild the cache or something
	});
};

