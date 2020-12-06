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
    .setText('Enter githhub repo names to fetch their star count.');
  
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
    .setId('day')
    .setType(types.YEAR_MONTH_DAY);

  return fields;
}

function getSchema(request) {
  var fields = getFields(request).build();
  return { schema: fields };
}

function responseToRows(requestedFields, response, repository) {
  // Transform parsed data and filter for requested fields
  return response.map(function(star) {
    var row = [];
    requestedFields.asArray().forEach(function (field) {
      switch (field.getId()) {
        case 'day':
          Logger.log(Utilities.formatDate(new Date(star.starred_at), "GMT", "yyyy-MM-dd"))
          return row.push(Utilities.formatDate(new Date(star.starred_at), "GMT", "yyyyMMdd"));
        case 'user':
          return row.push(star.user.login);
        case 'repository':
          return row.push(repository);
        default:
          return row.push('');
      }
    });
    return { values: row };
  });
}

function testData() {
   getData({
     "fields":[{"name": "day"}, {"name": "user"}, {"name": "repository"}],
     "configParams": {
       "repository": 'canonical-web-and-design/vanilla-framework'
     }
   });
}

function getData(request) {
  var requestedFieldIds = request.fields.map(function(field) {
    return field.name;
  });
  var requestedFields = getFields().forIds(requestedFieldIds);
  //var startDate = request.dateRange.startDate;
  //var endDate = request.dateRange.endDate;
  
  var page = 1;
  var stars = [];
  while(true) {
    // Fetch and parse data from API
    var url = [
      'https://api.github.com/repos/',
      request.configParams.repository,
      "/stargazers?per_page=100",
      "&page=",
      page
    ];
  
    var options = {"headers": {"Accept": "application/vnd.github.v3.star+json"}};
    var response = UrlFetchApp.fetch(url.join(''), options);
    var parsedResponse = JSON.parse(response);
    if(parsedResponse.length === 0) {
      break;
    } else {
      page = page + 1;
    }

    stars = stars.concat(stars, parsedResponse)
  }
  
  var rows = responseToRows(requestedFields, stars, request.configParams.repository);

  return {
    schema: requestedFields.build(),
    rows: rows
  };
}
