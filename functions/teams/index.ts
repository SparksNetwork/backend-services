import {CreateWithOwnerProfileKey} from "../../helpers/CreateWithOwnerProfileKey";
import {
  UpdateTransform,
  RemoveTransform
} from "../../helpers/CommandToDataTransform";
import {lensPath, set, view} from 'ramda';
import {lookup} from "../../lib/ExternalFactories/Firebase";
import {λ} from "../../lib/lambda";

const partitionKey = lensPath(['partitionKey']);
const projectKeyPath = lensPath(['data', 'values', 'projectKey']);
const teamKeyPath = lensPath(['data', 'key']);

/**
 * Change the partition key to the project key using the value in the data
 */
function valuesProjectPartitionKey([message]:any[]):any[] {
  return [set(partitionKey, view(projectKeyPath, message), message)];
}

/**
 * Change the partition key to the project key using the value from firebase
 */
async function lookupProjectPartitionKey([message]:any[]):Promise<any[]> {
  const projectKey = await lookup('Teams', view(teamKeyPath, message) as string, 'projectKey');
  return [set(partitionKey, projectKey, message)];
}

export default λ('teams',
  CreateWithOwnerProfileKey('command.Teams.create', valuesProjectPartitionKey),
  UpdateTransform('command.Teams.update', lookupProjectPartitionKey),
  RemoveTransform('command.Teams.remove', lookupProjectPartitionKey)
);