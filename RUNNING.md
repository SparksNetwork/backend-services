# Running locally

### AWS Credentials 

Make sure you have your AWS credentials set in the environment. These are required for pulling the latest docker images.

```
AWS_DEFAULT_REGION=us-west-2
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=XXX
AWS_SECRET_ACCESS_KEY=XXX
```

### Firebase Credentials
You need a service credentials file for firebase.

1. From firebase console click on cog on left menu
2. Select "Permissions"
3. Select "Service Accounts" from left menu
4. "Create Service Account"
5. It can be named anything, I suggest firebase-queue
6. Select "Project" -> "Owner" from the role dropdown
7. Click "Furnish a new private key"
8. Select "JSON"

Once created it will prompt you to download the key. Save it and copy it to this directory naming it `firebase.json`

### Docker

Install docker. For mac: https://docker.github.io/docker-for-mac

### npm modules

You'll probably get better results with yarn:

```
npm install -g yarn
yarn install
```

## Now to run this up:

```
npm run local
```
