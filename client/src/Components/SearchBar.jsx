import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();

    if (!keyword.trim()) {
      return navigate({
        pathname: "/",
      });
    } else {
      return navigate({
        pathname: `/search/${keyword}`,
      });
    }
  };

  return (
    <Form onSubmit={submitHandler} style={{ display: "flex", gap: "8px" }}>
      <Form.Control
        type='text'
        name='q'
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder='Search Products...'
        className='mr-sm-2 ml-sm-5'
      ></Form.Control>
      <Button type='submit' variant='outline-success' className='p-2'>
        Search
      </Button>
    </Form>
  );
};

export default SearchBar;
