import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

type TaskFormModalProps = {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  task?: any;
};

const TaskFormModal: React.FC<TaskFormModalProps> = ({ open, onCancel, onSubmit, task }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    if (task) {
      form.setFieldsValue({
        ...task,
        dueDate: task.dueDate ? dayjs(task.dueDate) : null,
      });
    } else {
      form.resetFields();
      setFileList([]);
    }
  }, [task, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const formatted = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        isBacklog: true,
      };

      if (fileList.length > 0) {
        formatted.img = fileList[0].originFileObj;
      } else {
        formatted.img = null;
      }

      onSubmit(formatted);
    } catch {}
  };

  const uploadProps = {
    beforeUpload: () => false,
    onRemove: (file: any) => {
      setFileList([]);
    },
    onChange: (info: any) => {
      setFileList(info.fileList.slice(-1));
    },
    fileList,
  };

  return (
    <Modal
      title={task ? 'Edit Task' : 'Create New Task'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={task ? 'Save Changes' : 'Create'}
      centered
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: 'Please enter task title' }]}
        >
          <Input placeholder="Enter task title" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea rows={3} placeholder="Enter description (optional)" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="Type" name="type" initialValue="Task">
            <Select>
              <Option value="Feature">Feature</Option>
              <Option value="Task">Task</Option>
              <Option value="Bug">Bug</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Priority" name="priority" initialValue="Low">
            <Select>
              <Option value="Low">Low</Option>
              <Option value="Medium">Medium</Option>
              <Option value="High">High</Option>
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="Story Point" name="point" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Source" name="source">
            <Input placeholder="" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="Image">
            <Upload {...uploadProps} listType="picture">
              <button type="button" className="ant-btn">
                <UploadOutlined /> Upload Image
              </button>
            </Upload>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default TaskFormModal;
