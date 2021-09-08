const { spawn } = require("child_process");
const { count } = require("console");
const fs = require("fs");

let queries = [];
let retreivalResults = [];
let map = [];

for(let i=0;i<10;i++) {
  map[i] = new Array();
}

for(let i=0;i<10;i++) {
  for(let j=0;j<10;j++) {
    map[i][j] = 0;
  }
}

var logger = fs.createWriteStream('Output.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
})


const callme = () => {

  // console.log(map);
  // // console.log(map[0]);
  // // console.log(map[1]);
  // // console.log(map[2]);


  callfinal();
} 

const callfinal = () => {
  for(let i=0;i<10;i++) {
    for(let j=0;j<10;j++) {
      if(map[i][j] != 0) {
        map[i][j] = map[i][j] / 225;
      }
    }
  }

  console.log(map);
  
// Write data in 'Output.txt' .
console.log("hogaya be!!");

logger.write(JSON.stringify(map));
// fs.writeFile('Output.txt', JSON.stringify(map), (err) => {
      
//     // In case of a error throw err.
//     if (err) throw err;
// })
}



const getPrecision = (retreivalQueryDocId, retreivedId, queryNo) => {
  let matches = 0;
  let actualMatches = retreivalQueryDocId[queryNo];
  // console.log("this is actual mapping", actualMatches)
  // console.log("this is retreved docid", retreivedId);
  // console.log("this is query no", queryNo);
  if(actualMatches != undefined && retreivedId != undefined) {
  for(let i=0;i<actualMatches.length;i++) {
    for(let j=0;j<retreivedId.length;j++) {
      if(actualMatches[i] === retreivedId[j]) {
        ++matches;
      }
    }
  }
}

  // console.log("this s matches",matches);

  return parseInt(matches)/10;
}

fs.readFile("query.txt", "utf-8", (err, data) => {
  if (err) throw err;
  let pre = data.split("\r\n");
  let i = 0;
  while (i < pre.length) {
    let temp = "";
    if (pre[i] != undefined) {
      while (pre[i].length > 6 || pre[i][0] != ".") {
        temp += pre[i];
        i++;
        if (pre[i] == undefined) break;
      }
    }
    queries.push(temp);
    i++;
  }

  queries = queries.filter(query => query != '');

  const fs = require("fs");

  fs.readFile("cranqrel.txt", "utf-8", (err, data) => {
    if (err) throw err;
    let retreival = [];
    let temp = "";

    for (let i = 0; i < data.length; i++) {
      temp += data[i];
      if (data[i] == "\n") {
        retreival.push(temp);
        temp = "";
      }
    }

    let retreivalQueryDocId = [];

    retreival.map((data) => retreivalQueryDocId.push(data.slice(0, -1)));

    let queryToDocId = [];
    let arr = [];
    let preVal = "";
    for (let i = 0; i < retreivalQueryDocId.length; i++) {
      let temp = retreivalQueryDocId[i];
      let queryNo = "",
        docId = "",
        value = "";
      let st = 0;
      for (let j = 0; j < temp.length; j++) {
        if (j == 0) {
          value += temp[j];
        } else {
          if (temp[j] == " ") {
            st++;
            if (st == 1) {
              queryNo = value;
              value = "";
            } else if (st == 2) {
              docId = value;
              value = "";
            }
          } else {
            value += temp[j];
          }
        }
      }

      if (i == 0) {
        preVal = queryNo;
        arr.push(docId);
      } else {
        if (queryNo == preVal) {
          arr.push(docId);
        } else {
          queryToDocId.push(arr);
          arr = [];
          preVal = queryNo;
        }
      }
    }

    for (let aval = 1; aval <=9; aval++) {
      for (let bval = 1; bval <= 9; bval++) {
        for (let q = 0; q < queries.length; q++) {
          // console.log(queries[q] + " " + aval + " " + bval);
          const python = spawn("python", [
            "script3.py",
            queries[q],
            aval,
            bval,
            q+1
          ]);

          python.stdout.on("data", function (data) {
            let valid = data.toString().split(" ");
            valid = valid[0].split("\r\n");
            let queryId = valid[0];
            // console.log("this is queryId", queryId);
            valid[0] = -1;
            map[aval][bval] += getPrecision(queryToDocId, valid, queryId);
            logger.write(aval + " "+ bval + " " + map[aval][bval] + " " + "\n");
            if(aval === 9 && bval === 9 && q === queries.length-1) {
              callme();
            } 
          });
        }
      }
    }
  });
});
