const routeToTest='/api/users';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');


const {app, runServer, closeServer} = require('../server');
const {Users} = require('../routes/users/models');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);
const expect = chai.expect;

function seedTestData(){
  console.info('seeding test data');
  const seedData=[];
  for(let i=1; i<=10;i++){
    seedData.push({
      username: faker.name.firstName(),
      password: faker.random.words()
    });
  }
  return Users.insertMany(seedData);
}

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('test Users endpoint',function(){
  before(function(){
    return runServer(TEST_DATABASE_URL);
  });
	
  beforeEach(function() {
    return seedTestData();
    });

  afterEach(function() {
    return tearDownDb();
  });	

  after(function(){
    return closeServer();
  });
	
  describe('POST endpoint', function() {
    // POST will 1) create an item in database and 2) return the created item.
    // so must check 1) the response has correct code and content contains correct keys and 2) the response matches the newly created database item	
    it('should add a new item', function() {
      // newItem compliant with model schema, not virtuals
      const newItem = {
        username: faker.name.firstName(),
        password: faker.random.words()
      };
      return chai.request(app)
      .post(routeToTest)
      .send(newItem)
      .then(function(res) {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body).to.include.keys('username');
	      // check response match request
        expect(res.body.username).to.equal(newItem.username);
        // cause Mongo should have created id on insertion
        expect(res.body.id).to.not.be.null;
        // pass value to next .then()
        console.log(res.body.id)
        return Users.findById(res.body.id);
      })
      .then(function(dbItem) {
	      // check db item match request
        expect(dbItem.username).to.equal(newItem.username);
      });
    });
  });	
});	
