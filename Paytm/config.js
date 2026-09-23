var PaytmConfig = {
  mid: process.env.PAYTM_MID || "",
  key: process.env.PAYTM_KEY || "",
  website: process.env.PAYTM_WEBSITE || "WEBSTAGING",
};
module.exports.PaytmConfig = PaytmConfig;
