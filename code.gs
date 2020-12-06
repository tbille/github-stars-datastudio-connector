var GITHUBTOKEN = "<ADD YOUR GITHUB TOKEN>"

var cc = DataStudioApp.createCommunityConnector();

function getAuthType() {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.NONE)
    .build();
}

function getConfig(request) {
  var config = cc.getConfig();
  
  config.newInfo()
    .setId('instructions')
    .setText('Enter GitHub repo names to fetch their star count.');
  
  config.newTextInput()
    .setId('repository')
    .setName('Enter a repo with its org')
    .setHelpText('e.g. canonical-web-and-design/vanilla-framework')
    .setPlaceholder('canonical-web-and-design/vanilla-framework');
  
  config.setDateRangeRequired(true);
  
  return config.build();
}

function getFields(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;
  
  fields.newDimension()
    .setId('repository')
    .setType(types.TEXT);
  
  fields.newDimension()
    .setId('user')
    .setType(types.TEXT);
  
  fields.newDimension()
    .setId('Date')
    .setType(types.YEAR_MONTH_DAY);
    
  fields.newDimension()
    .setId('totalStars')
    .setType(types.NUMBER);

  return fields;
}

function getSchema(request) {
  var fields = getFields(request).build();
  return { schema: fields };
}

function responseToRows(requestedFields, response, repository, totalStars, startDate, endDate) {
  var end = false;
  var res =  [];
  for(var i in response){
    var star = response[i];

    var row = [];
    var starredAt = new Date(star["starredAt"])
    var starredValue = starredAt.valueOf();
    
    if (startDate.valueOf() > starredValue) {
      end = true;
      break;
    }

    if (starredValue > endDate.valueOf()) {
      continue;
    }

    requestedFields.asArray().forEach(function (field) {
      switch (field.getId()) {
        case 'Date':
          return row.push(Utilities.formatDate(starredAt, "GMT", "yyyyMMdd"));
        case 'user':
          return row.push(star["node"]["login"]);
        case 'repository':
          return row.push(repository);
        case 'totalStars':
          return row.push(totalStars);
        default:
          return row.push('');
      }
    });

    res.push({ values: row })
  }
  
  return {
    "parsed": res,
    "end": end
  }
}

function testData() {
   getData({
     "fields":[{"name": "Date"}, {"name": "user"}, {"name": "repository"}, {"name": "totalStars"}],
     "configParams": {
       "repository": 'canonical-web-and-design/vanilla-framework'
     },
     "dateRange": {
       "startDate":  "2019-09-11",
       "endDate": "2019-09-18"
     }
   });
}

function getData(request) {
  var requestedFieldIds = request.fields.map(function(field) {
    return field.name;
  });
  var requestedFields = getFields().forIds(requestedFieldIds);
  var startDate = new Date(request.dateRange.startDate);
  var endDate = new Date(request.dateRange.endDate);
  
  repositorySplitted = request.configParams.repository.split("/");
  
  var stars = [];
  var next;
  while(true) {
    var url = 'https://api.github.com/graphql';

    if (next) {
      var query = {
        "query": "{ repository (name: \"" + repositorySplitted[1] + "\", owner: \"" + repositorySplitted[0] + "\") { stargazers(first: 100, orderBy: {field: STARRED_AT, direction: DESC}, after: \"" + next + "\") {totalCount edges {starredAt node {login}} pageInfo {hasNextPage endCursor}}}}"
      }
    } else { 
        var query = {
        "query": "{ repository (name: \"" + repositorySplitted[1] + "\", owner: \"" + repositorySplitted[0] + "\") { stargazers(first: 100, orderBy: {field: STARRED_AT, direction: DESC}) {totalCount edges {starredAt node {login}} pageInfo {hasNextPage endCursor}}}}"
      }
    }

    var options = {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "bearer " + GITHUBTOKEN
      },
      "payload": JSON.stringify(query),
      "muteHttpExceptions": true
    };
    
    try { var response = UrlFetchApp.fetch(url, options); } 
    catch (e) { Logger.log(e);  }
    var parsedResponse = JSON.parse(response);

    var totalStars = parsedResponse["data"]["repository"]["stargazers"]["totalCount"];
    var pageInfo = parsedResponse["data"]["repository"]["stargazers"]["pageInfo"];

    var parsedData = responseToRows(
      requestedFields, 
      parsedResponse["data"]["repository"]["stargazers"]["edges"], 
      request.configParams.repository, 
      totalStars,
      startDate, 
      endDate
    )

    stars = stars.concat(parsedData["parsed"])
    
    if(!parsedData["end"] && pageInfo["hasNextPage"]) {
      next = pageInfo["endCursor"];
    } else {
      break;
    }
  }

  return {
    schema: requestedFields.build(),
    rows: stars
  };
}
