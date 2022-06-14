	let header1 = document.getElementById("header1");
	enableTransliteration(header1, "mr");
	
	let header2 = document.getElementById("header2");
	enableTransliteration(header2, "mr");
	
	let desc1 = document.getElementById("desc1");
	enableTransliteration(desc1, "mr");
	
	let desc2 = document.getElementById("desc2");
	enableTransliteration(desc2, "mr");
	
	let desc4 = document.getElementById("desc4");
	enableTransliteration(desc4, "mr");
	
	let desc5 = document.getElementById("desc5");
	enableTransliteration(desc5, "mr");
	
	let desc6 = document.getElementById("desc6");
	enableTransliteration(desc6, "mr");
	
	let desc12 = document.getElementById("desc12");
	enableTransliteration(desc12, "mr");
	
	let desc13 = document.getElementById("desc13");
	enableTransliteration(desc13, "mr");
	
	let desc14 = document.getElementById("desc14");
	enableTransliteration(desc14, "mr");
	
	let desc15 = document.getElementById("desc15");
	enableTransliteration(desc15, "mr");
	
	let desc17 = document.getElementById("desc17");
	enableTransliteration(desc17, "mr");
	
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
	
	control.makeTransliteratable(["desc1"]);
	control.makeTransliteratable(["desc2"]);
	control.makeTransliteratable(["desc4"]);
	control.makeTransliteratable(["desc5"]);
	control.makeTransliteratable(["desc6"]);
	control.makeTransliteratable(["desc12"]);
	control.makeTransliteratable(["desc13"]);
	control.makeTransliteratable(["desc14"]);
	control.makeTransliteratable(["desc15"]);
	control.makeTransliteratable(["desc17"]);
	control.makeTransliteratable(["desc20"]);
	control.makeTransliteratable(["desc21"]);
	control.makeTransliteratable(["desc22"]);
	control.makeTransliteratable(["desc23"]);
	control.makeTransliteratable(["desc24"]);
	control.makeTransliteratable(["desc25"]);
	
	control.c.qc.t13n.c[3].c.d.keyup[0].ia.F.p = 'https://www.google.com';