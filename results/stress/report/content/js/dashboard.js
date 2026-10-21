/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 99.604, "KoPercent": 0.396};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.96878, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.9731, 500, 1500, "03 - GET /api/products/{id}"], "isController": false}, {"data": [0.9722, 500, 1500, "02 - GET /api/products"], "isController": false}, {"data": [0.9632, 500, 1500, "04 - POST /api/orders"], "isController": false}, {"data": [0.9677, 500, 1500, "05 - POST /api/login (sai mật khẩu - negative test)"], "isController": false}, {"data": [0.9677, 500, 1500, "01 - POST /api/login"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 25000, 99, 0.396, 239.00091999999802, 6, 2033, 282.0, 472.0, 660.0, 900.9900000000016, 432.4137334601747, 152.78589304246304, 100.72398896263945], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["03 - GET /api/products/{id}", 5000, 16, 0.32, 216.88359999999972, 6, 1806, 189.0, 436.0, 519.8999999999996, 849.9699999999993, 88.94897886572262, 19.75600252726286, 16.661585687886927], "isController": false}, {"data": ["02 - GET /api/products", 5000, 24, 0.48, 228.7407999999999, 11, 1439, 204.0, 444.0, 528.9499999999998, 873.9899999999998, 89.01073469460417, 79.2591914709914, 17.732607302440673], "isController": false}, {"data": ["04 - POST /api/orders", 5000, 29, 0.58, 258.90919999999994, 31, 2033, 235.0, 477.0, 569.8499999999995, 889.9799999999996, 88.77368037924116, 19.576313045958134, 25.384747211396764], "isController": false}, {"data": ["05 - POST /api/login (sai mật khẩu - negative test)", 5000, 0, 0.0, 246.0441999999996, 21, 1357, 220.5, 465.0, 594.8999999999996, 885.9899999999998, 88.89837138183628, 18.92562984496124, 22.22459284545907], "isController": false}, {"data": ["01 - POST /api/login", 5000, 30, 0.6, 244.42680000000027, 21, 1710, 220.0, 463.0, 590.0, 899.9899999999998, 89.09479686386315, 19.663500089094796, 21.57764611546686], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["The operation lasted too long: It took 1,524 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,204 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,163 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,029 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,505 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,219 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,233 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,238 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,151 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,065 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,026 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,493 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,651 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,341 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,195 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,188 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,201 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,296 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 2.0202020202020203, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 1,327 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,144 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,115 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,274 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 2.0202020202020203, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 1,150 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 2.0202020202020203, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 1,604 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,626 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,314 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 2,033 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,183 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,194 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,273 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,224 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,083 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,240 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 2.0202020202020203, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 1,262 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 2.0202020202020203, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 1,158 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,169 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,627 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,045 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,203 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,806 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,012 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 2.0202020202020203, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 1,024 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 2.0202020202020203, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 1,516 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,001 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,247 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,057 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,214 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,283 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,044 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 2.0202020202020203, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 1,208 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,063 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,222 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,237 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,275 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,710 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,114 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,439 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,162 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,700 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,145 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 2.0202020202020203, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 1,140 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,330 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,189 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,015 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,010 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,177 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,316 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,239 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 2.0202020202020203, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 1,020 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,042 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,016 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,105 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,154 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,165 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,138 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,110 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,087 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,220 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,006 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 2.0202020202020203, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 1,519 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,017 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,344 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,186 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,153 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 2.0202020202020203, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 1,142 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,290 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 1,265 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 1.0101010101010102, 0.004], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 25000, 99, "The operation lasted too long: It took 1,296 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, "The operation lasted too long: It took 1,274 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, "The operation lasted too long: It took 1,150 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, "The operation lasted too long: It took 1,240 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, "The operation lasted too long: It took 1,262 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["03 - GET /api/products/{id}", 5000, 16, "The operation lasted too long: It took 1,274 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, "The operation lasted too long: It took 1,604 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,222 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,240 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,262 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1], "isController": false}, {"data": ["02 - GET /api/products", 5000, 24, "The operation lasted too long: It took 1,239 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, "The operation lasted too long: It took 1,020 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,204 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,314 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,044 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1], "isController": false}, {"data": ["04 - POST /api/orders", 5000, 29, "The operation lasted too long: It took 1,524 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,044 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,029 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,219 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,275 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1], "isController": false}, {"data": [], "isController": false}, {"data": ["01 - POST /api/login", 5000, 30, "The operation lasted too long: It took 1,163 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,505 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,063 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,710 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,140 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
