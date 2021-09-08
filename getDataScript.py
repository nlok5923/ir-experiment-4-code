import sys
import requests
import json

# init weights 
weight_title = sys.argv[2]
weight_date = sys.argv[3]

# preparing query data sys.argv[1] contains the query text
query = {
    "query": {
        "multi_match": {
            "query": sys.argv[1],
            "fields": ["title" + "^" + weight_title, "data" + "^" + weight_date]
         }
     }
}

# our index name is cran-data which we had formed on importing cran field dataset  
def search(query):
    url = 'http://localhost:9200/cran-data/_search'
    httpResp = requests.get(url, data=json.dumps(query), headers={"content-type":"application/json"})
    searchHits = json.loads(httpResp.text)["hits"]
    print(sys.argv[4])
    
    for idx, hit in enumerate(searchHits['hits']):
        print("%s" %(hit['_source']['id']))
search(query)