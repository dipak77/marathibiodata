	let header1 = document.getElementById("header1");
	enableTransliteration(header1, "mr");
	
	let header2 = document.getElementById("header2");
	enableTransliteration(header2, "mr");
	
	let title1 = document.getElementById("title1");
	enableTransliteration(title1, "mr");
	
	let title2 = document.getElementById("title2");
	enableTransliteration(title2, "mr");
	
	let title3 = document.getElementById("title3");
	enableTransliteration(title3, "mr");
	
	let title4 = document.getElementById("title4");
	enableTransliteration(title4, "mr");
	
	let title5 = document.getElementById("title5");
	enableTransliteration(title5, "mr");
	
	let title6 = document.getElementById("title6");
	enableTransliteration(title6, "mr");
	
	let title7 = document.getElementById("title7");
	enableTransliteration(title7, "mr");
	
	let title8 = document.getElementById("title8");
	enableTransliteration(title8, "mr");
	
	let title9 = document.getElementById("title9");
	enableTransliteration(title9, "mr");
	
	let title10 = document.getElementById("title10");
	enableTransliteration(title10, "mr");
	
	let title11 = document.getElementById("title11");
	enableTransliteration(title11, "mr");
	
	let title12 = document.getElementById("title12");
	enableTransliteration(title12, "mr");
	
	let title13 = document.getElementById("title13");
	enableTransliteration(title13, "mr");
	
	let title14 = document.getElementById("title14");
	enableTransliteration(title14, "mr");
	
	let title15 = document.getElementById("title15");
	enableTransliteration(title15, "mr");
	
	let title16 = document.getElementById("title16");
	enableTransliteration(title16, "mr");
	
	let title17 = document.getElementById("title17");
	enableTransliteration(title17, "mr");
	
	let title18 = document.getElementById("title18");
	enableTransliteration(title18, "mr");
	
	let title19 = document.getElementById("title19");
	enableTransliteration(title19, "mr");
	
	let title20 = document.getElementById("title20");
	enableTransliteration(title20, "mr");
	
	let title21 = document.getElementById("title21");
	enableTransliteration(title21, "mr");
	
	let title22 = document.getElementById("title22");
	enableTransliteration(title22, "mr");
	
	let title23 = document.getElementById("title23");
	enableTransliteration(title23, "mr");
	
	let title24 = document.getElementById("title24");
	enableTransliteration(title24, "mr");
	
	let title25 = document.getElementById("title25");
	enableTransliteration(title25, "mr");
	
	let desc1 = document.getElementById("desc1");
	enableTransliteration(desc1, "mr");
	
	let desc2 = document.getElementById("desc2");
	enableTransliteration(desc2, "mr");
	
	let desc3 = document.getElementById("desc3");
	enableTransliteration(desc3, "mr");
	
	let desc4 = document.getElementById("desc4");
	enableTransliteration(desc4, "mr");
	
	let desc5 = document.getElementById("desc5");
	enableTransliteration(desc5, "mr");
	
	let desc6 = document.getElementById("desc6");
	enableTransliteration(desc6, "mr");
	
	let desc7 = document.getElementById("desc7");
	enableTransliteration(desc7, "mr");
	
	let desc8 = document.getElementById("desc8");
	enableTransliteration(desc8, "mr");
	
	let desc9 = document.getElementById("desc9");
	enableTransliteration(desc9, "mr");
	
	let desc10 = document.getElementById("desc10");
	enableTransliteration(desc10, "mr");
	
	let desc11 = document.getElementById("desc11");
	enableTransliteration(desc11, "mr");
	
	let desc12 = document.getElementById("desc12");
	enableTransliteration(desc12, "mr");
	
	let desc13 = document.getElementById("desc13");
	enableTransliteration(desc13, "mr");
	
	let desc14 = document.getElementById("desc14");
	enableTransliteration(desc14, "mr");
	
	let desc15 = document.getElementById("desc15");
	enableTransliteration(desc15, "mr");
	
	let desc16 = document.getElementById("desc16");
	enableTransliteration(desc16, "mr");
	
	let desc17 = document.getElementById("desc17");
	enableTransliteration(desc17, "mr");
	
	let desc18 = document.getElementById("desc18");
	enableTransliteration(desc18, "mr");
	
	let desc19 = document.getElementById("desc19");
	enableTransliteration(desc19, "mr");
	
	let desc20 = document.getElementById("desc20");
	enableTransliteration(desc20, "mr");
	
	let desc21 = document.getElementById("desc21");
	enableTransliteration(desc21, "mr");
	
	let desc22 = document.getElementById("desc22");
	enableTransliteration(desc22, "mr");
	
	let desc23 = document.getElementById("desc23");
	enableTransliteration(desc23, "mr");
	
	let desc24 = document.getElementById("desc24");
	enableTransliteration(desc24, "mr");
	
	let desc25 = document.getElementById("desc25");
	enableTransliteration(desc25, "mr");
	
	var control = new google.elements.transliteration.TransliterationControl(options);
	
	control.makeTransliteratable(["header1"]);
	control.makeTransliteratable(["header2"]);
	
	for(var i=1;i<=25;i++)	{
						
		control.makeTransliteratable(["title"+i]);
		control.makeTransliteratable(["desc"+i]); 
	
	}
	
	control.c.qc.t13n.c[3].c.d.keyup[0].ia.F.p = 'https://www.google.com';