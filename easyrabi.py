import mysql.connector
from mysql.connector import FieldType
import json
import pdb
import datetime
from flask import Flask,render_template,request

# Flask constructor takes the name of
# current module (__name__) as argument.
app = Flask(__name__)

mydb = mysql.connector.connect(
  host="localhost",
  user="myadmin",
  passwd="myadmin",
  auth_plugin='mysql_native_password',
  database="q2r"
)

@app.route('/')
def getIndexPage():
    return render_template('index.html')

@app.route('/home')
def getHomePage():
    return render_template('home.html')

@app.route('/graph')
def getGraphPage():
    return render_template('graph.html')

@app.route('/rest/sql', methods = ['POST'])
def getData():
    print("Executing query..")
    mycursor = mydb.cursor()
    mycursor.execute(request.data)
    print("Done executing query..Retriving results..")
    cols = mycursor.description
    columns = []
    index=0;
    for column in cols:
        mycol = {}
        mycol['name']=column[0]
        mytype = FieldType.get_info(column[1])
        mycol['dataType']='string'
        print(mytype+"-"+column[0])
        if mytype=='BLOB':
            mycol['dataType']='string'
            mycol['isDim']='true'
        if mytype=='VAR_STRING':
            mycol['dataType']='string'
            mycol['isDim']='true'
        if mytype=='DATE':
            mycol['dataType']='date'
            mycol['isDim']='true'
        if mytype=='TIME':
            mycol['dataType']='time'
            mycol['isDim']='true'
        if mytype=='DATETIME':
            mycol['dataType']='datetime'
            mycol['isDim']='true'
        if mytype=='TIMESTAMP':
            mycol['dataType']='timestamp'
            mycol['isDim']='true'
        if mytype=='DOUBLE':
            mycol['dataType']='number'
            mycol['isFact']='true'
        if mytype=='LONG':
            mycol['dataType']='number'
            mycol['isFact']='true'
        if mytype=='NEWDECIMAL':
            mycol['dataType']='number'
            mycol['isFact']='true'

        mycol['index']=index
        index=index+1
        columns.append(mycol)

    rows = []
    for row in mycursor:
        mycols=[]
        for col in row:
            if isinstance(col,datetime.date):
                mycols.append(str(col))
            else:
                mycols.append(col)
        print(mycols)
        rows.append(mycols)
    print("Done retriving results..returning..")
    mycursor.close()

    data = {}
    data['rows']=rows
    data['columns']=columns
    print(data)
    return json.dumps(data)

if __name__ == '__main__':
    app.run(port=4000,debug=True)
