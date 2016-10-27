import * as apex from 'apex.js';
import {spread} from "../../lib/spread";
import {
  UpdateTransform, RemoveTransform
} from "../../helpers/CommandToDataTransform";
import {CreateWithOwnerProfileKey} from "../../helpers/CreateWithOwnerProfileKey";

export default apex(spread(
  CreateWithOwnerProfileKey('projects', 'command.Projects.create'),
  UpdateTransform('command.Projects.update'),
  RemoveTransform('command.Projects.remove')
))