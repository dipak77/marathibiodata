
function cimage()	{
		
	var canvas 	= document.getElementById("myCanvas");
	var ctx 	= canvas.getContext("2d");
	
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	var theme = result["theme"];
	var fmt = result["fmt"];
	var lang  = result["lang"];
	
	var bg = new Image();
	bg.src = "theme/t-"+theme+".png";
	
	bg.onload = function()
	{
		ctx.drawImage(bg, 0, 0, 612, 792); // x,y,w,h
				
		ctx.fillStyle 	= "#000000";	
		ctx.textAlign = "center";
		
		ctx.font      	 = "15px BiodataFont";						
		ctx.fillText(result["header1"], 306, 50);
		
		ctx.font      	= "Bold 20px BiodataFont";
		if(lang=="ENG") ctx.font      = "Bold 18px BiodataFont";
		
		ctx.fillText(result["header2"], 306, 80);
		
		var txnId = result["txnId"];		
		if(txnId=="")	{
			
			ctx.fillStyle = "#949494";
			ctx.font 	  = "25px BiodataFont";	
			
			ctx.fillText("ramanudesignart.com", 306, 350);
			ctx.fillText("ramanudesignart.com", 306, 550);
					
		}
		ctx.fillStyle 	= "#000000";
		ctx.textAlign = "left";
		
		/*ctx.font 	  	= "12px BiodataFont";		
		ctx.fillText("ramanudesignart.com", 230, 750);*/
		
		var y = 85;
		for(var i=1;i<=25;i++)	{
			
			if(fmt==1)	{
				
				var title 	= result["title"+i];
				var desc  	= result["desc"+i];						
								
				if(desc!="")	{
					
					y = y+26;
					
					ctx.font      = "Bold 18px BiodataFont";
					if(lang=="ENG") ctx.font      = "Bold 16px BiodataFont";
					
					ctx.fillText(title, 50, y);
					
					ctx.font      = "18px BiodataFont";	
					if(lang=="ENG") ctx.font      = "16px BiodataFont";
					
					ctx.fillText(":", 175, y);
					ctx.fillText(desc, 190, y);
				
				}
				
			}else if(fmt==2)	{
				
				var title 	= result["title"+i];
				var desc  	= result["desc"+i];	

				if(lang=="MAR")	{
					
					if(i==1)	{
						y = y+24;
						ctx.font      = "Bold 17px BiodataFont";
						ctx.fillText("स्वतःबद्दल माहिती", 50, y);	
						y = y+2;
					}else if(i==14)	{
						y = y+26;
						ctx.font      = "Bold 17px BiodataFont";
						ctx.fillText("कौटुंबिक माहिती", 50, y);
						y = y+2;
					}		
					
				}else if(lang=="HIN")	{
					
					if(i==1)	{
						y = y+24;
						ctx.font      = "Bold 17px BiodataFont";
						ctx.fillText("व्यक्तिगत विवरण", 50, y);
						y = y+2;
					}else if(i==14)	{
						y = y+26;
						ctx.font      = "Bold 17px BiodataFont";
						ctx.fillText("पारिवारिक विवरण", 50, y);
						y = y+2;
					}
				
				}else if(lang=="ENG")	{
					
					if(i==1)	{
						y = y+24;
						ctx.font      = "Bold 15px BiodataFont";
						ctx.fillText("Personal Details", 50, y);
						y = y+2;
					}else if(i==14)	{
						y = y+26;
						ctx.font      = "Bold 15px BiodataFont";
						ctx.fillText("Family Details", 50, y);
						y = y+2;
					}
				
				}
					
				if(title!="" || desc!="")	{
					
					y = y+24;
					
					ctx.font      = "17px BiodataFont";
					if(lang=="ENG") ctx.font      = "15px BiodataFont";
					
					ctx.fillText(title, 50, y);
					ctx.fillText(":", 170, y);
					
					if(desc=="") desc="-";
					
					ctx.fillText(desc, 185, y);
					
				}
								
			}
			
		}
			
		var photo = "photos/"+result["rId"]+".png";
	
		if(photo!="")	{			
			var image = new Image();
			image.src = photo;
			
			image.onload = function()	{
						
				ctx.drawImage(image, 412, 102, 150, 225);
			}
		}
		
		
				
	}
	
	
}

function download(format) {
		
	if(format=="jpg")	{
		
		var download = document.getElementById("download_jpg");
		var image = document.getElementById("myCanvas").toDataURL("image/jpg")
		.replace("image/jpg", "image/octet-stream");
		download.setAttribute("href", image);
		
	}else if(format=="png")	{
		
		var download = document.getElementById("download_png");
		var image = document.getElementById("myCanvas").toDataURL("image/png")
		.replace("image/png", "image/octet-stream");
		download.setAttribute("href", image);
		
	}else if(format=="pdf")	{
		
		var canvas 	= document.getElementById("myCanvas");
		var imgData = canvas.toDataURL('image/png');    
		var doc = new jsPDF('p', 'mm', [170,218]); 
		doc.addImage(imgData, 'PNG', 4, 4); 
		doc.save('marriage-biodata.pdf'); 
		
	}
	

}

