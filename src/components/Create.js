import { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { ethers } from "ethers";

const Create = ({ provider, dao, setIsLoading }) => {
  const createHandler = async (e) => {
    e.preventDefault();
    console.log("Creating proposal...");
  };

  return (
    <Form>
      <Form.Group style={{ maxWidth: "450px", margin: "50px auto" }}>
        <Form.Control
          type="number"
          placeholder="Enter name"
          className="my-2"
          onChange={(e) => setName(e.target.value)}
        />
        <Form.Control
          type="text"
          placeholder="Enter amount"
          className="my-2"
          onChange={(e) => setName(e.target.value)}
        />
        <Form.Control
          type="text"
          placeholder="Enter address"
          className="my-2"
          onChange={(e) => setName(e.target.value)}
        />
        <Button variant="primary" type="submit" style={{ width: "100%" }}>
          Create Proposal
        </Button>
      </Form.Group>
    </Form>
  );
};

export default Create;
