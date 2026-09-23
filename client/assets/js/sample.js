/* ShubhBiodata — shared sample biodata + pro photo for previews */
(function () {
  'use strict';

  function sampleFields(lang) {
    const mr = {
      name: 'आरव अमित देशमुख',
      caste: 'मराठी देशस्थ',
      dob: '1996-08-15',
      birthTime: '06:45 AM',
      birthPlace: 'पुणे, महाराष्ट्र',
      height: "5'9\"",
      weight: '72',
      complexion: 'गोरा',
      blood: 'B+',
      rashi: 'सिंह',
      nadi: 'मध्य',
      gan: 'देव गण',
      mangal: 'नाही',
      devak: 'चव्हाण',
      gotra: 'कश्यप',
      education: 'बी.ई. कंप्यूटर इंजिनिअरिंग (म.इं. पुणे)',
      occupation: 'सॉफ्टवेअर इंजिनिअर – पुणे',
      income: '₹12,00,000 वार्षिक',
      fatherName: 'अमित देशमुख',
      fatherOcc: 'सेवानिवृत्त शिक्षक',
      motherName: 'स्वाती देशमुख',
      motherOcc: 'गृहिणी',
      brothers: 0, brothersMarried: 0, sisters: 1, sistersMarried: 0,
      mama: 'प्रकाश जोशी, चाकण',
      relatives: 'पाटील कुटुंब, हवेली बाजार',
      contact: '98765 43210',
      address: 'प्लॉट 14, सुप्रिया नगर, कोथरूड, पुणे – 411038',
      expectations: 'सुसंस्कार, शिक्षित व आर्थिकदृष्ट्या समान कुटुंबाची वहिनी.'
    };
    const en = {
      name: 'Aarav Amit Deshmukh',
      caste: 'Marathi Deshastha',
      dob: '1996-08-15',
      birthTime: '06:45 AM',
      birthPlace: 'Pune, Maharashtra',
      height: "5'9\"",
      weight: '72',
      complexion: 'Fair',
      blood: 'B+',
      rashi: 'Simha',
      nadi: 'Madhya',
      gan: 'Dev',
      mangal: 'No',
      devak: 'Chavan',
      gotra: 'Kashyap',
      education: 'B.E. Computer Engineering (COEP Pune)',
      occupation: 'Software Engineer – Pune',
      income: '₹12,00,000 per annum',
      fatherName: 'Amit Deshmukh',
      fatherOcc: 'Retired teacher',
      motherName: 'Swati Deshmukh',
      motherOcc: 'Homemaker',
      brothers: 0, brothersMarried: 0, sisters: 1, sistersMarried: 0,
      mama: 'Prakash Joshi, Chakan',
      relatives: 'Patil family, Haveli Bazaar',
      contact: '98765 43210',
      address: 'Plot 14, Supriya Nagar, Kothrud, Pune – 411038',
      expectations: 'Well-cultured, educated bride from a similar family.'
    };
    if (lang === 'en') return en;
    if (lang === 'hi') {
      const hi = Object.assign({}, en, {
        name: 'आरव अमित देशमुख',
        caste: 'मराठी देशस्थ',
        weight: '72',
        complexion: 'गोरा',
        education: 'बी.ई. कंप्यूटर इंजीनियरिंग (सीओईपी पुणे)',
        occupation: 'सॉफ्टवेयर इंजीनियर – पुणे',
        income: '₹12,00,000 प्रति वर्ष',
        fatherOcc: 'सेवानिवृत्त शिक्षक',
        motherOcc: 'गृहिणी',
        relatives: 'पाटील कुटुंब, हवेली बाज़ार',
        address: 'प्लॉट 14, सुप्रिया नगर, कोथरूड, पुणे – 411038',
        expectations: 'सुसंस्कार, शिक्षित और समान पारिवारिक पृष्ठभूमि की वधू.'
      });
      return hi;
    }
    return mr;
  }

  const PHOTO = 'images/groom.jpg';

  function emptyFields() {
    return sampleFields('mr') && Object.keys(sampleFields('mr')).reduce((o, k) => {
      o[k] = typeof sampleFields('mr')[k] === 'number' ? 0 : '';
      return o;
    }, {});
  }

  function stateFor(themeId, lang) {
    lang = lang || 'mr';
    const t = window.$t ? window.$t(lang) : null;
    const B = (t && t.biodata) || { invocation: '॥ श्री गणेशाय नमः ॥', docTitle: 'बायोडाटा' };
    return {
      lang: lang,
      step: 1,
      theme: themeId || 1,
      ink: 'classic',
      invocation: B.invocation,
      docTitle: B.docTitle,
      photo: PHOTO,
      premium: true,
      zoomLevel: 100,
      fields: sampleFields(lang)
    };
  }

  window.SampleData = {
    PHOTO: PHOTO,
    sampleFields: sampleFields,
    emptyFields: emptyFields,
    stateFor: stateFor
  };
})();
