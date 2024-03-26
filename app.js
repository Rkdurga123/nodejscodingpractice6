const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(30000, () => {
      console.log('Server running at http://localhost:3000')
    })
  } catch (e) {
    console.log('DB Error is ${e.message}')
    process.exit(1)
  }
}
initializeDBAndServer()

const convertDBStatesAPI = objectItem => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  }
}

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
       SELECT * FROM state;
    `
  const statesArry = await db.all(getStatesQuery)
  response.send(statesArry.map(eachState => convertDBStatesAPI(eachState)))
})

app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
       SELECT * FROM state WHERE state_id=${stateId};
    `
  const state = await db.get(getStateQuery)
  response.send(convertDBStatesAPI(state))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body

  const addnewDistrictQuery = `
       INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
       VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});
    `
  const updatedQueryRes = await db.run(addnewDistrictQuery)
  response.send('District Succesfully Added')
})

const convertDistrictDBApi = objectItem => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  }
}

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
       SELECT * FROM district WHERE district_id=${districtId};
    `
  const district = await db.get(getDistrictQuery)
  response.send(convertDistrictDBApi(district))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
      DELETE  FROM district WHERE district_id=${districtId};
    `
  await db.run(deleteQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updatedDistrictQuery = `
       UPDATE district
       SET district_name='${districtName}',
       state_id=${stateId}, cases=${cases}, cured=${cured}, active=${active}, deaths=${deaths};
    `
  const updatedQueryRes = await db.run(updatedDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats', async (request, response) => {
  const {stateId} = request.params
  const getTotalStatusQuery = `
       SELECT sum(cases) as totalCases, sum(cured) as totalCured, sum(active) as totalActive, sum(deaths) as totalDeaths WHERE state_id=${stateId};
    `
  const getTotalStatusRes = await db.all(getTotalStatusQuery)
  response.send(getTotalStatusRes)
})

app.get('/distircts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
       SELECT state_id from district WHERE district_id=${districtId};
    `
  const getDistrictIdRes = await db.get(getDistrictIdQuery)

  const getStateNameQuery = `
       SELECT state_name FROM state WHERE state_id=${getDistrictIdRes.state_id};
    `
  const getStateNameRes = await db.get(getStateNameQuery)
  response.send(getStateNameRes)
})

module.exports = app
