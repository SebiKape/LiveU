const dbConfig = {
    "userName": "user_trial",
    "password": "7412LIVE!@#$%¨&*()",
    "server": "virtual2.febracorp.org.br",
    "port": 1433,
    "options": {
      "database": "CONTOSO"
    }
  };

  const apiConfig = {
    method: 'post',
    url: 'http://138.68.29.250:8082/',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
};

module.exports = {
    dbConfig,
    apiConfig
  };
