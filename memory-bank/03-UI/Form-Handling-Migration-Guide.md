# Form Handling Migration Guide: Material UI to Mantine

## Overview

This document provides a comprehensive guide for migrating form handling from Material UI to Mantine in the RPG Archivist application. Mantine offers a powerful form handling solution through the `@mantine/form` package, which provides a different approach compared to Material UI's form components.

## Key Differences

### Material UI Form Handling

Material UI's form handling typically involves:

- Individual form components like `TextField`, `Select`, etc.
- Manual state management with React's `useState`
- Manual validation logic
- No built-in form state management

### Mantine Form Handling

Mantine's form handling with `@mantine/form` offers:

- A centralized form state management solution
- Built-in validation
- Support for nested fields and lists
- Form submission handling
- Schema validation integration (Zod, Yup, Joi, etc.)
- Performance optimizations with uncontrolled mode

## Setup Requirements

### Required Dependencies

```bash
npm install @mantine/form
```

### Optional Dependencies for Schema Validation

```bash
# For Zod validation
npm install zod mantine-form-zod-resolver

# For Yup validation
npm install yup mantine-form-yup-resolver

# For Joi validation
npm install joi mantine-form-joi-resolver
```

## Migration Patterns

### 1. Basic Form Migration

#### Material UI (Before)

```tsx
import { useState } from 'react';
import { TextField, Button } from '@material-ui/core';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (value) => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (isEmailValid && isPasswordValid) {
      // Submit form
      console.log('Form submitted', { email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => validateEmail(email)}
        error={!!emailError}
        helperText={emailError}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => validatePassword(password)}
        error={!!passwordError}
        helperText={passwordError}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" color="primary">
        Login
      </Button>
    </form>
  );
}
```

#### Mantine (After)

```tsx
import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button } from '@mantine/core';

function LoginForm() {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
    },
  });

  const handleSubmit = (values) => {
    console.log('Form submitted', values);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Email"
        placeholder="your@email.com"
        {...form.getInputProps('email')}
        key={form.key('email')}
      />
      <PasswordInput
        label="Password"
        placeholder="Your password"
        mt="md"
        {...form.getInputProps('password')}
        key={form.key('password')}
      />
      <Button type="submit" mt="xl">
        Login
      </Button>
    </form>
  );
}
```

### 2. Nested Form Fields

#### Material UI (Before)

```tsx
import { useState } from 'react';
import { TextField, Button } from '@material-ui/core';

function ProfileForm() {
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      zipCode: '',
    },
  });
  const [errors, setErrors] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      zipCode: '',
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const validate = () => {
    const newErrors = {
      name: '',
      address: {
        street: '',
        city: '',
        zipCode: '',
      },
    };
    let isValid = true;

    if (!formData.name) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.address.street) {
      newErrors.address.street = 'Street is required';
      isValid = false;
    }

    if (!formData.address.city) {
      newErrors.address.city = 'City is required';
      isValid = false;
    }

    if (!formData.address.zipCode) {
      newErrors.address.zipCode = 'Zip code is required';
      isValid = false;
    } else if (!/^\d{5}$/.test(formData.address.zipCode)) {
      newErrors.address.zipCode = 'Invalid zip code format';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form submitted', formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={!!errors.name}
        helperText={errors.name}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Street"
        name="address.street"
        value={formData.address.street}
        onChange={handleChange}
        error={!!errors.address.street}
        helperText={errors.address.street}
        fullWidth
        margin="normal"
      />
      <TextField
        label="City"
        name="address.city"
        value={formData.address.city}
        onChange={handleChange}
        error={!!errors.address.city}
        helperText={errors.address.city}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Zip Code"
        name="address.zipCode"
        value={formData.address.zipCode}
        onChange={handleChange}
        error={!!errors.address.zipCode}
        helperText={errors.address.zipCode}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" color="primary">
        Save Profile
      </Button>
    </form>
  );
}
```

#### Mantine (After)

```tsx
import { useForm } from '@mantine/form';
import { TextInput, Button } from '@mantine/core';

function ProfileForm() {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      address: {
        street: '',
        city: '',
        zipCode: '',
      },
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      address: {
        street: (value) => (!value ? 'Street is required' : null),
        city: (value) => (!value ? 'City is required' : null),
        zipCode: (value) => {
          if (!value) return 'Zip code is required';
          if (!/^\d{5}$/.test(value)) return 'Invalid zip code format';
          return null;
        },
      },
    },
  });

  const handleSubmit = (values) => {
    console.log('Form submitted', values);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Name"
        placeholder="Your name"
        {...form.getInputProps('name')}
        key={form.key('name')}
      />
      <TextInput
        label="Street"
        placeholder="Street address"
        mt="md"
        {...form.getInputProps('address.street')}
        key={form.key('address.street')}
      />
      <TextInput
        label="City"
        placeholder="City"
        mt="md"
        {...form.getInputProps('address.city')}
        key={form.key('address.city')}
      />
      <TextInput
        label="Zip Code"
        placeholder="Zip code"
        mt="md"
        {...form.getInputProps('address.zipCode')}
        key={form.key('address.zipCode')}
      />
      <Button type="submit" mt="xl">
        Save Profile
      </Button>
    </form>
  );
}
```

### 3. List Fields

#### Material UI (Before)

```tsx
import { useState } from 'react';
import { TextField, Button, IconButton } from '@material-ui/core';
import { Add, Delete } from '@material-ui/icons';

function EducationForm() {
  const [education, setEducation] = useState([
    { institution: '', degree: '', year: '' },
  ]);
  const [errors, setErrors] = useState([
    { institution: '', degree: '', year: '' },
  ]);

  const addEducation = () => {
    setEducation([...education, { institution: '', degree: '', year: '' }]);
    setErrors([...errors, { institution: '', degree: '', year: '' }]);
  };

  const removeEducation = (index) => {
    const newEducation = [...education];
    newEducation.splice(index, 1);
    setEducation(newEducation);

    const newErrors = [...errors];
    newErrors.splice(index, 1);
    setErrors(newErrors);
  };

  const handleChange = (index, field, value) => {
    const newEducation = [...education];
    newEducation[index][field] = value;
    setEducation(newEducation);
  };

  const validate = () => {
    let isValid = true;
    const newErrors = education.map((edu) => {
      const eduErrors = { institution: '', degree: '', year: '' };
      
      if (!edu.institution) {
        eduErrors.institution = 'Institution is required';
        isValid = false;
      }
      
      if (!edu.degree) {
        eduErrors.degree = 'Degree is required';
        isValid = false;
      }
      
      if (!edu.year) {
        eduErrors.year = 'Year is required';
        isValid = false;
      } else if (!/^\d{4}$/.test(edu.year)) {
        eduErrors.year = 'Invalid year format';
        isValid = false;
      }
      
      return eduErrors;
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form submitted', education);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {education.map((edu, index) => (
        <div key={index}>
          <TextField
            label="Institution"
            value={edu.institution}
            onChange={(e) => handleChange(index, 'institution', e.target.value)}
            error={!!errors[index]?.institution}
            helperText={errors[index]?.institution}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Degree"
            value={edu.degree}
            onChange={(e) => handleChange(index, 'degree', e.target.value)}
            error={!!errors[index]?.degree}
            helperText={errors[index]?.degree}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Year"
            value={edu.year}
            onChange={(e) => handleChange(index, 'year', e.target.value)}
            error={!!errors[index]?.year}
            helperText={errors[index]?.year}
            fullWidth
            margin="normal"
          />
          {education.length > 1 && (
            <IconButton onClick={() => removeEducation(index)}>
              <Delete />
            </IconButton>
          )}
        </div>
      ))}
      <Button
        type="button"
        startIcon={<Add />}
        onClick={addEducation}
        variant="outlined"
      >
        Add Education
      </Button>
      <Button type="submit" variant="contained" color="primary">
        Save
      </Button>
    </form>
  );
}
```

#### Mantine (After)

```tsx
import { useForm } from '@mantine/form';
import { TextInput, Button, Group, Box } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { randomId } from '@mantine/hooks';

function EducationForm() {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      education: [
        { institution: '', degree: '', year: '', key: randomId() },
      ],
    },
    validate: {
      education: {
        institution: (value) => (!value ? 'Institution is required' : null),
        degree: (value) => (!value ? 'Degree is required' : null),
        year: (value) => {
          if (!value) return 'Year is required';
          if (!/^\d{4}$/.test(value)) return 'Invalid year format';
          return null;
        },
      },
    },
  });

  const handleSubmit = (values) => {
    console.log('Form submitted', values);
  };

  const fields = form.getValues().education.map((_, index) => (
    <Box key={form.getValues().education[index].key} mb="md">
      <TextInput
        label="Institution"
        placeholder="Institution name"
        {...form.getInputProps(`education.${index}.institution`)}
        key={form.key(`education.${index}.institution`)}
      />
      <TextInput
        label="Degree"
        placeholder="Degree"
        mt="sm"
        {...form.getInputProps(`education.${index}.degree`)}
        key={form.key(`education.${index}.degree`)}
      />
      <TextInput
        label="Year"
        placeholder="Year"
        mt="sm"
        {...form.getInputProps(`education.${index}.year`)}
        key={form.key(`education.${index}.year`)}
      />
      {form.getValues().education.length > 1 && (
        <Button
          color="red"
          variant="outline"
          leftIcon={<IconTrash size="1rem" />}
          onClick={() => form.removeListItem('education', index)}
          mt="sm"
        >
          Remove
        </Button>
      )}
    </Box>
  ));

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      {fields}
      <Group position="center" mt="md">
        <Button
          leftIcon={<IconPlus size="1rem" />}
          onClick={() =>
            form.insertListItem('education', {
              institution: '',
              degree: '',
              year: '',
              key: randomId(),
            })
          }
        >
          Add Education
        </Button>
      </Group>
      <Button type="submit" mt="xl">
        Save
      </Button>
    </form>
  );
}
```

### 4. Schema Validation with Zod

#### Material UI (Before)

```tsx
import { useState } from 'react';
import { TextField, Button } from '@material-ui/core';
import * as z from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'You must be at least 18 years old'),
});

function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    age: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'age' ? (value === '' ? '' : Number(value)) : value,
    });
  };

  const validate = () => {
    try {
      schema.parse({
        ...formData,
        age: formData.age === '' ? 0 : Number(formData.age),
      });
      setErrors({ name: '', email: '', age: '' });
      return true;
    } catch (error) {
      const newErrors = { name: '', email: '', age: '' };
      error.errors.forEach((err) => {
        const path = err.path[0];
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form submitted', formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={!!errors.name}
        helperText={errors.name}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={!!errors.email}
        helperText={errors.email}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Age"
        name="age"
        type="number"
        value={formData.age}
        onChange={handleChange}
        error={!!errors.age}
        helperText={errors.age}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" color="primary">
        Register
      </Button>
    </form>
  );
}
```

#### Mantine (After)

```tsx
import { useForm } from '@mantine/form';
import { TextInput, NumberInput, Button } from '@mantine/core';
import { zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'You must be at least 18 years old'),
});

function RegistrationForm() {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      email: '',
      age: 0,
    },
    validate: zodResolver(schema),
  });

  const handleSubmit = (values) => {
    console.log('Form submitted', values);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Name"
        placeholder="Your name"
        {...form.getInputProps('name')}
        key={form.key('name')}
      />
      <TextInput
        label="Email"
        placeholder="your@email.com"
        mt="md"
        {...form.getInputProps('email')}
        key={form.key('email')}
      />
      <NumberInput
        label="Age"
        placeholder="Your age"
        mt="md"
        min={0}
        {...form.getInputProps('age')}
        key={form.key('age')}
      />
      <Button type="submit" mt="xl">
        Register
      </Button>
    </form>
  );
}
```

## Best Practices

### 1. Use Uncontrolled Mode

Mantine forms offer an uncontrolled mode that improves performance by reducing re-renders:

```tsx
const form = useForm({
  mode: 'uncontrolled',
  initialValues: {
    // ...
  },
});
```

### 2. Use Form Keys for Lists

When working with lists, always use a unique key for each item and pass it to the `key` prop of form inputs:

```tsx
const fields = form.getValues().items.map((item, index) => (
  <div key={item.key}>
    <TextInput
      {...form.getInputProps(`items.${index}.name`)}
      key={form.key(`items.${index}.name`)}
    />
  </div>
));
```

### 3. Validate on Blur

Enable validation on blur for better user experience:

```tsx
const form = useForm({
  mode: 'uncontrolled',
  validateInputOnBlur: true,
  // ...
});
```

### 4. Use Built-in Validators

Mantine provides built-in validators for common validation scenarios:

```tsx
import { isEmail, isNotEmpty, hasLength, matches } from '@mantine/form';

const form = useForm({
  mode: 'uncontrolled',
  validate: {
    email: isEmail('Invalid email'),
    name: isNotEmpty('Name is required'),
    password: hasLength({ min: 6 }, 'Password must be at least 6 characters'),
    username: matches(/^[a-z0-9]+$/, 'Username can only contain letters and numbers'),
  },
});
```

## Conclusion

This form handling migration guide provides a comprehensive approach for transitioning from Material UI's form components to Mantine's `@mantine/form` package. By following these patterns and examples, developers can ensure a consistent and maintainable form handling system throughout the RPG Archivist application.
