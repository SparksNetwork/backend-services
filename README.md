## Local development

Run kinesalite:

```
npm install -g kinesalite
kinesalite --ssl
```

OR

```
docker run -d -p 4567:4567 vsouza/kinesis-local -p 4567 --ssl
```

Run the dispatcher:

```
KINESIS_ENDPOINT=https://localhost:4567 nf run npm start
```

Now run the function you're writing with the simulator specifying the stream name and function name:

```
KINESIS_ENDPOINT=https://localhost:4567 node simulator/kinesis-simulator.js commands crud
```