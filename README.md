# Summer Bucket Server

This server provides public API in support of the [Summer Bucket Client App](https://github.com/jiehan1029/summer-bucket-app). The server is alive [here](https://summer-bucket-server.herokuapp.com/).

## API documentation
### API base url
The server offers the following API with base url being "https://summer-bucket-server.herokuapp.com/api"

### /users - POST
For user registration. 
Example of request:
```
{
	headers:{
		Content-Type: "application/json"
	},
	body:{
		username:"username",
		password:"password"
	}
}
```
On success, server will respond with status 201 and JSON object ```{username:"username"}```.
### /auth/login - POST
Create jwt auth token once received a valid username and password combination. On success, response with status code 200 and auth token ```{authToken:"user's-jwt-authToken"}```.

### /auth/refresh - POST
If accessed by an authenticated user, refresh the token by creating a new auth token and returns it.

### /auth/logout - GET
Logout user.

### /my-bucket - GET
A protected endpoint for retrieving all activity tickets from a user's bucket. Must include authorization in request headers. On success, server returns status code 200 and JSON containing all tickets of the user, for example:
```
[{
	what:"activity name",
	where:"location",
	type:"activity type",
	details:"more info",
	ticketId:"database generated id"
}]
```

### /my-bucket - POST
A protected endpoint for creating new activity ticket. Must include authorization in request headers. Request body shall provide the following parameters in JSON format: what (required), where (optional), type (optional), details (optional).
If a user already has a bucket, it will add a new ticket to that bucket; otherwise it will create a new bucket and add the ticket into it.
On success, server returns status code 201 and JSON of the newly created ticket.

### /my-bucket/ticket/:ticketId - PUT
A protected endpoint for updating an existing activity ticket. Request.params.ticketId must match the database ticket id. Must include authorization in request headers. Request body shall provide one or more of the following parameters that requires updates: what, where, type, and details. 
On success, server returns status code 200 and the updated ticket.

### /my-bucket/ticket/:ticketId - DELETE
A protected endpoint for deleting an existing activity ticket. Request.params.ticketId must match the database ticket id. Must include authorization in request headers.
On success: server returns status 204.

### /my-wall - GET
A protected endpoint for retriving all records of the user. Must include authorization in request headers.
On success, server returns an array of records:
```
[{
	ticketId:"database ticket id",
	ticketName:"activity name (what)",
	dateStr:"record date in string",
	date:"record date as date object",
	imageUrl:[{
		src:"img-src",
		comment:"img-caption"
		}],
	id:"database record id"
}]
```

### /my-wall/ticket/:ticketId - POST
A protected endpoint for creating a new record (moment) for a specific activity ticket. Request.params.ticketId must match the database ticket id. Must include authorization in request headers. User is able to upload an image as part of FormData (```<input type="file" />```). Request should also supply date in string (**Date**), activity name (**ticketName**), comment of the image (**comment**), when applicable.
On success, server returns status code 201.

### /my-wall/ticket/:ticketId/record/:recordId - PUT
A protected endpoint for uploading a new image to an existing record of a specific activity ticket. Request.params.ticketId and request.params.recordId must match the database ticket id and record id. Must include authorization in request headers. Allowable parameters to update include **date**, **comment** and **src**, which should be provided in request body as FormData.
On success, server returns status code 200 and the updated record.

### /my-wall/ticket/:ticketId/record/:recordId - DELETE
A protected endpoint for deleting an existing record as a whole. Request.params.ticketId and request.params.recordId must match the database ticket and record id. Must include authorization in request headers.
On success, server returns status code 204.

### /my-wall/image/:imageId - DELETE
A protected endpoint for deleting a single image from a record. Request.params.imageId must match the database image id. Must include authorization in request headers.
On success, server returns status code 204.

## Technologies used
This server is written in **Node.js** with **Mongo** database. To provide better consistency and stability, **mLab** is employed instead of a local database. **Mongoose** is used as database interface.
User authentication is handled using JSON web token (JWT) and image upload & storage is implemented with Cloudinary.
All test is done with **mocha** and **chai**.
Continuous integration and deployment are achieved with **TravisCI** and **Heroku**.