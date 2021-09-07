import sys
import requests
import json

# query = sys.argv[1]
# print('First param:'+sys.argv[1]+'#')

# query = {      
#     "query": {
#         "match": {
#             "title":"what are the laws which are concerned about the dynamic viscous nature of fluid in heated substance"
#          }
#      }
# }
a = sys.argv[2]
b = sys.argv[3]

query = {
    "query": {
        "multi_match": {
            "query": sys.argv[1],
            "fields": ["title" + "^" + a, "data" + "^" + b]
         }
     }
}



def search(query):
    url = 'http://localhost:9200/cran-data/_search'
    httpResp = requests.get(url, data=json.dumps(query), headers={"content-type":"application/json"})
    searchHits = json.loads(httpResp.text)["hits"]
    #  print ("Sno: \tRelevance Score\t\t ID\t Title")
    #  print(searchHits)
    
    for idx, hit in enumerate(searchHits['hits']):
        print("%s" %(hit['_source']['id']))
search(query)