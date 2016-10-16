import * as apex from 'apex.js';
import {spread} from "../../lib/spread";
import {
  UpdateTransform, RemoveTransform
} from "../../helpers/CommandToDataTransform";
import {CreateWithOwnerProfileKey} from "../../helpers/CreateWithOwnerProfileKey";

export default apex(spread(
  CreateWithOwnerProfileKey('Projects.create'),
  UpdateTransform('Projects.update'),
  RemoveTransform('Projects.remove')
))