import React, { useState } from "react";
import { Button, Form, Input, Modal, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { createCompany } from "../../services/companyService.js";

const Company: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const formData = new FormData();
      formData.append("Name", values.Name);
      formData.append("TaxCode", values.TaxCode);
      formData.append("Detail", values.Detail);
      formData.append("Email", values.Email);

      if (values.ImageCompany && values.ImageCompany[0]) {
        formData.append("ImageCompany", values.ImageCompany[0].originFileObj);
      }

      const response = await createCompany(formData);
      console.log(response);
      message.success("Company created successfully!");
      form.resetFields();
      handleClose();
    } catch (error: any) {
      message.error(error.message || "Failed to create company!");
    }
  };

  return (
    <>
      <Button type="primary" onClick={handleOpen}>
        Create Company
      </Button>

      <Modal
        title="Create Company"
        open={isModalOpen}
        onCancel={handleClose}
        onOk={handleSubmit}
        okText="Create"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="Name"
            label="Name"
            rules={[{ required: true, message: "Please enter company name" }]}
          >
            <Input placeholder="Enter company name" />
          </Form.Item>

          <Form.Item name="TaxCode" label="Tax Code">
            <Input placeholder="Enter tax code" />
          </Form.Item>

          <Form.Item name="Detail" label="Detail">
            <Input.TextArea placeholder="Enter details" rows={3} />
          </Form.Item>

          <Form.Item name="Email" label="Email">
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item name="ImageCompany" label="Company Image" valuePropName="fileList" getValueFromEvent={(e) => e?.fileList}>
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Company;
