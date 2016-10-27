import {
  UpdateTransform, RemoveTransform
} from "../../helpers/CommandToDataTransform";
import {CreateWithOwnerProfileKey} from "../../helpers/CreateWithOwnerProfileKey";
import {λ} from "../../lib/lambda";

export default λ(
  'projects',
  CreateWithOwnerProfileKey('command.Projects.create'),
  UpdateTransform('command.Projects.update'),
  RemoveTransform('command.Projects.remove')
);