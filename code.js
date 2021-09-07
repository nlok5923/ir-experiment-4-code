const { spawn } = require("child_process");
const { count } = require("console");
const fs = require("fs");

let queries = [];
let retreivalResults = [];
let map = [];

for(let i=0;i<100;i++) {
  map[i] = new Array();
}

for(let i=0;i<100;i++) {
  for(let j=0;j<100;j++) {
    map[i][j] = 0;
  }
}

const callme = () => {
  console.log(map[0]);
  console.log(map[1]);
  console.log(map[2]);
} 

const getPrecision = (retreivalQueryDocId, retreivedId, queryNo) => {
  let matches = 0;
  let actualMatches = retreivalQueryDocId[queryNo];
  // console.log("this is actual mapping", actualMatches)
  // console.log("this is retreved docid", retreivedId);
  console.log("this is query no", queryNo);
  for(let i=0;i<actualMatches.length;i++) {
    for(let j=0;j<retreivedId.length;j++) {
      if(actualMatches[i] === retreivedId[j]) {
        ++matches;
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

    for (let aval = 1; aval <= 10; aval++) {
      for (let bval = 1; bval <= 10; bval++) {
        for (let q = 0; q < queries.length; q++) {
          // console.log(queries[q] + " " + aval + " " + bval);
          const python = spawn("python", [
            "script3.py",
            queries[q],
            aval,
            bval,
          ]);

          python.stdout.on("data", function (data) {
            let valid = data.toString().split(" ");
            valid = valid[0].split("\r\n");
            map[aval][bval] += getPrecision(queryToDocId, valid, q+1);
            // console.log(map[aval][bval]);
            if(aval === 10 && bval === 10 && q === queries.length-1) {
              // console.log(" this is great");
              callme();
            } 
          });
        }
      }
    }
  });
});
