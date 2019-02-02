const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const { BlogPost } = require('../models');
const { TEST_DATABASE_URL } = require("../config");
const { app, runServer, closeServer } = require("../server");

const expect = chai.expect;

chai.use(chaiHttp);

//seeds data to test-blog-app db referenced in config.js
function seedBlogData(){
	const seedData = [];
	for(let i=1;i<=10;i++){
		seedData.push({
			author: faker.name.firstName()+" "+faker.name.lastName(),
			title: faker.lorem.sentence(),
			content: faker.lorem.text()
		});
	}
	return BlogPost.insertMany(seedData);
}

function tearDown(){
	return new Promise((resolve, reject)=>{
		mongoose.connection.dropDatabase()
			.then(result=>resolve(result))
			.catch(err=>reject(err));
	});	
}

describe('Blog Posts', function(){
	before(function(){
		return runServer(TEST_DATABASE_URL);
	});
	beforeEach(function(){
		return seedBlogData();
	});
	afterEach(function(){
		return tearDown();
	});
	after(function(){
		return closeServer();
	});


	it('Should list blog posts on GET', function(){
		let res;
		return chai
			.request(app)
			.get('/posts')
			.then(function(_res){
				res = _res;
				expect(res).to.have.status(200);
				expect(res.body).to.have.lengthOf(10);
				return BlogPost.count();
			})
			//does not work when this then method is added...
			.then(function(count){
				expect(res.body).to.have.lengthOf(count);
			});
	});

	it('Should get one blog post on GET', function(){
		let postId;
		return BlogPost
	  .findOne()
		.then(function(post) {
			postId = post.id;
		  return chai.request(app)
	      .get(`/posts/${post.id}`);
	   })
	  .then(function(res){
				expect(res).to.have.status(200);
				expect(res.body).to.be.a('object');
				expect(res.body.id).to.not.be.null;
				expect(res.body.id).to.equal(postId);
				expect(res.body.title).to.be.a('string');
				expect(res.body.content).to.be.a('string');
				expect(res.body.created).to.be.a('string');
		});
	});
	it('Should delete one blog post on DELETE', function(){
		let postId;
		return BlogPost
				.findOne()
				.then(function(post){
					postId = post.id;
					return chai.request(app)
							.delete(`/posts/${post.id}`);
				})
				.then(function(res){
					expect(res).to.have.status(204);
				})

				return BlogPost.findById(postId)
				.then(function(post){
						expect(post).to.be.null;
				});
	});
	it('Should add a blog post on POST', function(){
			let newPost = {
				title: "New Title",
				content: "Some content	...",
				author: {
						firstName: "Angel",
						lastName: "A"
				}
			};
			return	chai.request(app)
				.post("/posts").send(newPost)
				.then(function(res){
						expect(res).to.have.status(201);
						expect(res.body).to.be.a('object');
						expect(res.body.id).to.not.be.null;
						expect(res.body.title).to.be.a('string');
						expect(res.body.content).to.be.a('string');
						expect(res.body.author).to.be.a('string');
						expect(res.body.created).to.be.a('string');
						return BlogPost.findById(res.body.id);
				})
				.then(function(post){
					expect(post.title).to.equal(newPost.title);
					expect(post.content).to.equal(newPost.content);
					expect(post.author.firstName).to.equal(newPost.author.firstName);
					expect(post.author.lastName).to.equal(newPost.author.lastName);
				});
	});

	it('Should update a blog post on PUT', function(){
			let postId;
			let updatedPost = {
				title: "Updated Title",
				content: "Some content	...",
				author: {
						firstName: "Angel",
						lastName: "A"
				}
			};

			return BlogPost.findOne().then(function(post){
				postId = post.id;
				updatedPost.id = post.id;
				return chai.request(app)
						.put(`/posts/${post.id}`).send(updatedPost);
			})
			.then(function(res){
					expect(res).to.have.status(204);
					return BlogPost.findById(postId);
			})
			.then(function(post){
					expect(post.title).to.equal(updatedPost.title);
					expect(post.content).to.equal(updatedPost.content);
					expect(post.author.firstName).to.equal(updatedPost.author.firstName);
					expect(post.author.lastName).to.equal(updatedPost.author.lastName);
			});
	});


});