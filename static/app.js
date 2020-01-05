angular.module("easyrabi", ["ngRoute"])
.config(function($routeProvider) {
  $routeProvider
    .when("/graph",{templateUrl:"/graph"})
    .otherwise({templateUrl : "/home"});
})
.controller('RootController', function($scope, $http, $location) {
  $scope.issuccess=false;
  $scope.iserror=false;
  $scope.chartTypes=['bar','barstack','column','columnstack','line','area','scatter','pie','donut','annotate_line','table']
  $scope.sqlQuery='select hostname,DATE_FORMAT(ts,\'%d-%m-%Y\') as ts,avg(cpu),avg(mem),avg(swap),max(runq) from sysperf where hostname in (\'den01uen.us.oracle.com\',\'den03csk.us.oracle.com\',\'den02mfu.us.oracle.com\') group by hostname,DATE_FORMAT(ts,\'%d-%m-%Y\')';
  $scope.isready=true;
  $scope.selectedChartType='column';

  $scope.query = function() {
    console.log('Started executing query');
    $scope.isready=false;
    $scope.iserror=false;
    $scope.issuccess=false;
    $http.post("rest/sql",$scope.sqlQuery).then(
      function(data){
        console.log('Done executing query');
        $scope.data=data.data;
        $scope.xaxis=data.data.columns[0];
        $scope.iserror=false;
        $scope.issuccess=true;
        $scope.isready=true;
      },function(error){
        $scope.errorText=error.data;
        $scope.issuccess=false;
        $scope.iserror=true;
        $scope.isready=true;
      }
    );
  };

  $scope.graph = function() {
    console.log('Started building graph');
    $http.post("rest/sql",$scope.sqlQuery).then(
      function(data){
        console.log('Done executing query');
        $scope.data=data.data;
        $location.path('graph');
      },function(error){
        $scope.errorText=error.data;
      }
    );
  }

  $scope.showMean = function(){
		var chart = $scope.wrapper.getChart();
		google.visualization.events.trigger(chart,'mean',{});
	};

	$scope.showStdDev = function(){
		var chart = $scope.wrapper.getChart();
		google.visualization.events.trigger(chart,'stddev',{});
	};

  $scope.showFit = function(n){
		var chart = $scope.wrapper.getChart();
		google.visualization.events.trigger(chart,'polyfit',{n:n,f:true});
	};

  $scope.buildGraph = function(inChartType){
    google.charts.load('current', {'packages':['corechart','annotatedtimeline','charteditor']});
    google.charts.load('visualization', {'packages':['table']});

    var series={};
    var dataTableToPlot;
    var newcols = [];


    // Building new header columns
    var xcol = $scope.xaxis;
    xcol.newindex = 0;
    newcols.push(xcol);

    var ycols = $scope.yaxis;
    if($scope.zaxis){
      var zcol = $scope.zaxis;
    }else{
      var zcol = {};
      zcol.name="Default";
      zcol.dataType="string";
    }
    zcol.newindex=1;
    newcols.push(zcol);

    for(var i = 0;i<$scope.yaxis.length;i++){
      var ycol = $scope.yaxis[i];
      ycol.newindex=i+2;
      newcols.push(ycol);
    }


    // Building map of secondary dimension rows
    $scope.data.rows.forEach(function(row){
      var seriesKey="Default";
      var newindex=0;
      if($scope.zaxis){
        seriesKey = row[$scope.zaxis.index];
      }
      var newrows = series[seriesKey];
      if(!newrows){
        newrows = [];
        series[seriesKey]=newrows;
      }
      var newrow=[$scope.yaxis.length+2];
      newrow[newindex]=row[$scope.xaxis.index];
      newindex++;
      for(var i = 0; i < $scope.yaxis.length; i++){
        newrow[newindex]=row[$scope.yaxis[i].index];
        newindex++;
      }
      newrows.push(newrow);
    });

    var seriesKeys = Object.keys(series);
    for(var sindex = 0 ; sindex < seriesKeys.length ; sindex++){
      var seriesKey=seriesKeys[sindex];
      var rows = series[seriesKey];

      var gdata = new google.visualization.DataTable();
      gdata.addColumn($scope.xaxis.dataType,$scope.xaxis.name);

      for(var i = 0; i < $scope.data.columns.length; i++){
        var column = $scope.data.columns[i];
        for(var j = 0; j < $scope.yaxis.length; j++){
          if(column.name==$scope.yaxis[j].name){
            gdata.addColumn(column.dataType,seriesKey+"_"+column.name);
            break;
          }
        }
      }
      gdata.addRows(rows);

      if(!dataTableToPlot)
        dataTableToPlot = gdata.clone();
      else{
        var numCols = gdata.getNumberOfColumns();
        var numColsJoin = dataTableToPlot.getNumberOfColumns();
        var index=[];
        var indexJoin=[];
        for(k=1;k<numCols;k++){
          index[k-1]=k;
        }
        for(k=1;k<numColsJoin;k++){
          indexJoin[k-1]=k;
        }
        dataTableToPlot = google.visualization.data.join(dataTableToPlot, gdata, 'full', [[0, 0]],indexJoin,index );
      }
    }

    var chartType = $scope.selectedChartType;
    if(inChartType)
      chartType=inChartType;

    var chart;
    var element = document.getElementById('chartdiv');
    var cType='';
    if(chartType=='line'){
      chart = new google.visualization.LineChart(element);
      cType='LineChart';
    }	else if(chartType=='pie' || chartType=='donut'){
      chart = new google.visualization.PieChart(element);
      cType='PieChart';
    }	else if(chartType=='bar'){
      chart = new google.visualization.BarChart(element);
      cType='BarChart';
    }	else if(chartType=='barstack'){
      chart = new google.visualization.BarChart(element);
      cType='BarChart';
    }	else if(chartType=='column'){
      chart = new google.visualization.ColumnChart(element);
      cType='ColumnChart';
    }	else if(chartType=='columnstack'){
      chart = new google.visualization.ColumnChart(element);
      cType='ColumnChart';
    }   else if(chartType=='area'){
      chart = new google.visualization.AreaChart(element);
      cType='AreaChart';
    }    else if(chartType=='steppedarea'){
      chart = new google.visualization.SteppedAreaChart(element);
      cType='SteppedAreaChart';
    }  else if(chartType=='table'){
      chart = new google.visualization.Table(element);
      cType='Table';
    }	else if(chartType=='scatter'){
      chart = new google.visualization.ScatterChart(element);
      cType='ScatterChart';
    }  else if(chartType=='annotate_line'){
      chart = new google.visualization.AnnotatedTimeLine(element);
      cType='AnnotatedTimeLine';
    }
      var cssClassNames = {headerRow: 'celltable'};
      var options = {
          interval: {
            'mean': { 'style':'line','lineWidth': 2},
            'fit1': { 'style':'line', 'color':'orange','lineWidth': 2},
            'fit2': { 'style':'line', 'color':'green','lineWidth': 2},
            'fore1': { 'style':'line', 'color':'brown','lineWidth': 2},
            'fore2': { 'style':'line', 'color':'blue','lineWidth': 2},
            'stddev': { 'style':'area', 'color':'#4374E0','lineWidth': 2,'fillOpacity': 0.3},
            'normaldist': { 'style':'area', 'color':'#4374E0','lineWidth': 2,'fillOpacity': 0.3}
          },
          chart : { title: 'My Chart' },
          curveType: 'function',
          chartArea: {
            backgroundColor:{
              stroke:'grey',
              strokeWidth:1
            },
            width:'90%',
            height:'70%'
          },
          legend: {
            position: 'bottom',
            textStyle: {color: 'black', fontSize: 14,style:'bold'}
          },
          cssClassNames:{headerRow: 'gTableHeaderRow',headerCell: 'gTableHeaderCell'},
          allowHtml:true,
          hAxis:{textPosition:'out',showTextEvery:1}
      };
      if( chartType=='barstack' || chartType=='columnstack'){
        options["isStacked"]=true;
      }
      if(chartType=='table'){
        options["page"]='enable';
        options["width"]='100%';
      }
      if(chartType=='donut'){
        options["pieHole"]='0.4';
      }

      $scope.wrapper = new google.visualization.ChartWrapper({
        chartType: cType,
        dataTable: dataTableToPlot,
        options: options,
        container: document.getElementById('chartdiv')
      });
      $scope.wrapper.draw();

      google.visualization.events.addListener($scope.wrapper.getChart(), 'mean', function(){
  			var statsObj=getAnalytics(series);
        var keySet = Object.keys(series);
        keySet.forEach(function(key){
          var stats = statsObj[key];
          var rows = series[key];
          var numColsOrig = dataTableToPlot.getNumberOfColumns();
    			dataTableToPlot.addColumn({id:'mean',type:'number',role:'interval',label:key+'_Mean'});
    			for (i = 0; i < rows.length; i++){
    				dataTableToPlot.setCell(i,numColsOrig,stats.mean);
    			}
        });
  			$scope.wrapper.draw();
  		});

  		google.visualization.events.addListener($scope.wrapper.getChart(), 'stddev', function(){

        var statsObj=getAnalytics(series);
        var keySet = Object.keys(series);
        keySet.forEach(function(key){
          var stats = statsObj[key];
          var rows = series[key];
          var numColsOrig = dataTableToPlot.getNumberOfColumns();
          dataTableToPlot.addColumn({id:'stddev',type:'number',role:'interval',label:key+'_Standard Deviation'});
    			dataTableToPlot.addColumn({id:'stddev',type:'number',role:'interval',label:key+'_Standard Deviation'});
    			for (i = 0; i < rows.length; i++){
            dataTableToPlot.setCell(i,numColsOrig,stats.mean+stats.stddev);
            dataTableToPlot.setCell(i,numColsOrig+1,stats.mean-stats.stddev);

    			}
        });
  			$scope.wrapper.draw();
  		});

      google.visualization.events.addListener($scope.wrapper.getChart(), 'polyfit', function(obj){
  			var n = obj.n;
  			var f = obj.f;
  			var stats=getPolyFit(newrows,n);
  			var numColsOrig = dataTableToPlot.getNumberOfColumns();
  			if(f){
  				gdata.addColumn({id:'fore'+n,type:'number',role:'interval',label:n+' Order Regression','pointSize': 10});
  			}else{
  				gdata.addColumn({id:'fit'+n,type:'number',role:'interval',label:n+' Order Regression','pointSize': 10});
  			}
  			var range = newrows.length;
  			if(f){
  				range=newrows.length+30;
  			}
  			for (i = 0; i < range; i++){
  				if(i > newrows.length-1){
  					var x = newrows[newrows.length-1][0]+(i-newrows.length*1);
  				}else{
  					var x = newrows[i][0];
  				}
  				var y = 0;
  				for (j = 0; j <= n; j++){
  					y = y+stats[j]*Math.pow(x,j);
  				}
  				console.log('Y = '+y+', X = '+x);
  				if(i>newrows.length-1){
  					dataTableToPlot.addRow();
  					dataTableToPlot.setCell(i,0,x);
  					dataTableToPlot.setCell(i,1,y);
  				}
  				dataTableToPlot.setCell(i,numColsOrig,y);
  			}
  			$scope.wrapper.setDataTable(dataTableToPlot);
  			$scope.wrapper.draw();
  		});
  }

  function getPolyFit(rows,n){
  	var N = rows.length;
      var X=[2*n+1];
      for(i=0;i<=2*n;i++){
          X[i]=0;
          for(j=0;j<N;j++){
      		var x = rows[j][0];
          	X[i]=X[i]+Math.pow(x,i);
          }
      }
      var B=[n+1];
      var Y=[n+1];
      for(i=0;i<=n;i++){
          Y[i]=0;
          for(j=0;j<N;j++){
          	var y = rows[j][1];
          	var x = rows[j][0];
              Y[i]=Y[i]+Math.pow(x,i)*y;
          }
      }
      for(i=0;i<=n;i++){
      	B[i]=[n+2];
          for(j=0;j<=n;j++){
              B[i][j]=X[i+j];
          }
      }
      for(i=0;i<=n;i++){
          B[i][n+1]=Y[i];
      }
      var A=[n+1];
      gaussEliminationLS(n+1,n+2,B,A);
      for(i=0;i<=n;i++){
      	console.log('X'+n+' = '+A[i]);
      }
  	return A;
  }

  function gaussEliminationLS(m,n,a,x){
      var i,j,k;
      for(i=0;i<m-1;i++){
          for(k=i+1;k<m;k++){
              if(Math.abs(a[i][i])<Math.abs(a[k][i])){
                  for(j=0;j<n;j++){
                      var temp;
                      temp=a[i][j];
                      a[i][j]=a[k][j];
                      a[k][j]=temp;
                  }
              }
          }
          for(k=i+1;k<m;k++){
              var term=a[k][i]/ a[i][i];
              for(j=0;j<n;j++){
                  a[k][j]=a[k][j]-term*a[i][j];
              }
          }

      }
      for(i=m-1;i>=0;i--){
          x[i]=a[i][n-1];
          for(j=i+1;j<n-1;j++){
              x[i]=x[i]-a[i][j]*x[j];
          }
          x[i]=x[i]/a[i][i];
      }
  }

  function getAnalytics(series){
    var keySet = Object.keys(series);
    var statsObj = [];
    keySet.forEach(function(key){
      var rows = series[key];
      var sumy=0;
    	var count=0;
    	var mean=0;
    	var variance=0;
    	var stddev = 0;
    	for (i = 0; i < rows.length; i++){
    		var y = rows[i][1];
    		count++;
    		sumy=sumy+y;
    	}
    	mean = sumy/count;
    	var total=0;
    	for (i = 0; i < rows.length; i++){
    		var y = rows[i][1];
    		var diffvalue = ((y-mean)*(y-mean));
    		total = total + diffvalue;
    	}
    	variance = total/(count);
    	stddev = Math.sqrt(variance);
    	var obj = {};
    	obj.mean = Number(Number(mean).toFixed(2));
    	obj.stddev = Number(Number(stddev).toFixed(2));
    	obj.variance = Number(Number(variance).toFixed(2));
    	console.log('Mean = '+obj.mean+', Variance = '+obj.variance+', Standard Deviation = '+obj.stddev);
      statsObj[key]=obj;
    });
  	return statsObj;
  }
})
.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('//').endSymbol('//');
});
