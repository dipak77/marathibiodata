
function cimage()	{
	
   var result = {
  "biodataId": "80969",
  "rId": "RDA-1650711795-1512406164",
  "lang": "MAR",
  "theme": "6",
  "fmt": "1",
  "header1": "।। श्री गणेशाय नमः ।।",
  "header2": "बायोडाटा",
  "title1": "संपूर्ण नाव",
  "desc1": "समाधान हरी नरडे ",
  "title2": "जात",
  "desc2": "भोई ",
  "title3": "जन्मतारीख",
  "desc3": "20-03-1994",
  "title4": "जन्मवेळ",
  "desc4": "सकाळी 4 ला ",
  "title5": "जन्मठिकाण",
  "desc5": "नशिराबाद ",
  "title6": "देवक",
  "desc6": "रेणुका माता",
  "title7": "नाडी / गण",
  "desc7": "",
  "title8": "मंगळ",
  "desc8": "नाही ",
  "title9": "रंग",
  "desc9": "गोरा ",
  "title10": "रक्तगट",
  "desc10": "B+",
  "title11": "उंची",
  "desc11": "5.6",
  "title12": "शिक्षण",
  "desc12": "12+ ITI + Mechanical Diploma",
  "title13": "नोकरी / व्यवसाय",
  "desc13": "शेती (10 एकर बागायती ) , इलेक्ट्रिशियन ",
  "title14": "वडिलांचे नाव",
  "desc14": "हरी सोनाजी नरडे ",
  "title15": "व्यवसाय",
  "desc15": "शेती , इलेक्ट्रिशियन ",
  "title16": "संपर्क नंबर",
  "desc16": "६२६६९९४७२५",
  "title17": "आईचे नाव",
  "desc17": "",
  "title18": "भाऊ",
  "desc18": "2",
  "title19": "बहिणी",
  "desc19": "0",
  "title20": "मामा",
  "desc20": "पन्नालाल सिताराम वाडिले ",
  "title21": "नातेसंबंध",
  "desc21": "वाडीले ,हरणे , बावणे , भामद्रे",
  "title22": "",
  "desc22": "",
  "title23": "अपेक्षा",
  "desc23": "मनमिळाऊ , समजदार ",
  "title24": "राहण्याचा पत्ता",
  "desc24": "नशिराबाद बोरी , ता: नेपानगर जिला: बऱ्हाणपूर ",
  "title25": "",
  "desc25": "",
  "mobile": null,
  "email": null,
  "createdIP": "152.57.153.15",
  "createdDateTime": "2022-04-23 16:33:15",
  "txnId": "",
  "txnAmt": null,
  "txnDateTime": null
}
	
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
			
			ctx.fillText("", 306, 350);
			ctx.fillText("", 306, 550);
					
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
	function downloadCanvas(link, canvasId, filename) {
                link.href = canvas.toDataURL();
                link.download = filename;
            }

            /**
             * The event handler for the link's onclick event. We give THIS as a
             * parameter (=the link element), ID of the canvas and a filename.
             */
            document.getElementById('download').addEventListener('click', function() {
                downloadCanvas(this, 'canvas', 'mybiodata.png');
            }, false);
	
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

