var timeSince = function(date) {
    if (typeof date !== 'object') {
      date = new Date(date);
    }
  
    var seconds = Math.floor((new Date() - date) / 1000);
    var intervalType;
  
    var interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      intervalType = 'yr';
    } else {
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) {
        intervalType = 'mth';
      } else {
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
          intervalType = 'd';
        } else {
          interval = Math.floor(seconds / 3600);
          if (interval >= 1) {
            intervalType = "hr";
          } else {
            interval = Math.floor(seconds / 60);
            if (interval >= 1) {
              intervalType = "min";
            } else {
              interval = seconds;
              intervalType = "sec";
            }
          }
        }
      }
    }
  
    if (interval > 1 || interval === 0) {
      intervalType += 's';
    }
  
    return interval + ' ' + intervalType + " ago";
  };
  var aDay = 24 * 60 * 60 * 1000;
  console.log(timeSince(new Date(Date.now() - aDay)));
  console.log(timeSince(new Date(Date.now() - aDay * 2)));

  export default timeSince;