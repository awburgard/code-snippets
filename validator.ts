import moment from 'moment';
import { PackageMeta, FormDataCreation } from './types';
import { DraftConfig, Draft07 } from 'json-schema-library';
import JSZip from 'jszip';

const version = 2;
const last_modified = moment().format('YYYY-MM-DD');

const DEFAULT_TEMPLATE: Partial<PackageMeta> = {
  version,
  last_modified,
};

class PackageSchema {
  private schema?: Draft07;
  private template = DEFAULT_TEMPLATE;
  private blob?: Blob;
  private filename: string = '';
  private name: string = '';
  private description: string = '';
  private form: FormData = new FormData();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const response = await fetch(REDACTED);
      const schema: DraftConfig = await response.json();
      this.schema = new Draft07(schema);
    } catch (error) {
      console.error('Failed to load schema:', error);
    }
  }

  createMetaTemplate({ type, ...opts }: PackageMeta['record']): Partial<PackageMeta> {
    const newTemplate = {
      ...this.template,
      record: {
        ...this.template.record,
        type,
        ...opts,
      },
    };

    return this.schema?.getTemplate(newTemplate) || newTemplate;
  }

  createFormData() {
    if (!this.blob) {
      throw new Error('You must call createZip() before calling createFormData().');
    }

    const formData = new FormData();
    formData.append(REDACTED, this.filename.replace(/\.[^/.]+$/, '') + '.zip');
    formData.append(REDACTED, this.filename);
    formData.append(REDACTED, this.name);
    formData.append(REDACTED, this.description);
    formData.append(REDACTED, this.blob);

    this.form = formData;

    return this;
  }

  async createZip({ data, meta }: { data: FormDataCreation; meta: PackageMeta['record'] }) {
    try {
      const file = data.file;
      const uuid = self.crypto.randomUUID();

      this.filename = `${uuid}.zip`;
      this.name = data.name;
      this.description = data.description;

      const zip = new JSZip();

      if (file) {
        zip.file(data.filename, file.data);
      }

      const template = JSON.stringify(this.createMetaTemplate(meta));

      zip.file('.meta.json', template);

      this.blob = await zip.generateAsync({ type: 'blob' });

      return this;
    } catch (error) {
      console.error('Failed to create zip:', error);
    }
  }

  get getFilename() {
    return this.filename;
  }

  get getForm() {
    return this.form;
  }

  get getName() {
    return this.name;
  }

  get getDescription() {
    return this.description;
  }

  get getBlob() {
    return this.blob;
  }
}

export default PackageSchema;
