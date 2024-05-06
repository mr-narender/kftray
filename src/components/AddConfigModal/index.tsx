import React, { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import ReactSelect, { ActionMeta } from 'react-select'

import { InfoIcon } from '@chakra-ui/icons'
import {
  Button,
  Center,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  SimpleGrid,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react'
import { open } from '@tauri-apps/api/dialog'
import { invoke } from '@tauri-apps/api/tauri'

import { Config, CustomConfigProps, KubeContext, Option } from '../../types'

import { assertIsError, customStyles, fetchKubeContexts } from './utils'

const AddConfigModal: React.FC<CustomConfigProps> = ({
  isModalOpen,
  closeModal,
  newConfig,
  handleInputChange,
  handleSaveConfig,
  isEdit,
  configData,
  setNewConfig,
}) => {
  const [selectedContext, setSelectedContext] = useState<{
    name?: string
    value: string | number
    label: string
  } | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<{
    name?: string
    value: string | number
    label: string
  } | null>(null)
  const [selectedService, setSelectedService] = useState<{
    name?: string
    value: string | number
    label: string
  } | null>(null)
  const [selectedPort, setSelectedPort] = useState<{
    name?: string
    value: string | number
    label: string
  } | null>(null)
  const [selectedWorkloadType, setSelectedWorkloadType] = useState<{
    name?: string
    value: string | number
    label: string
  } | null>(null)
  const [selectedProtocol, setSelectedProtocol] = useState<{
    name?: string
    value: string | number
    label: string
  } | null>(null)

  const [isChecked, setIsChecked] = useState(false)
  const handleCheckboxChange = () => {
    setIsChecked(!isChecked)
  }

  useEffect(() => {
    const isValid = [
      selectedContext,
      selectedNamespace,
      selectedService ?? newConfig.remote_address,
      selectedPort ?? newConfig.remote_port,
      selectedWorkloadType,
      selectedProtocol,
      newConfig.alias,
      newConfig.local_port,
    ].every(field => field !== null && field !== '')

    setIsFormValid(isValid)
  }, [
    selectedContext,
    selectedNamespace,
    selectedService,
    selectedPort,
    selectedWorkloadType,
    selectedProtocol,
    newConfig.alias,
    newConfig.remote_address,
    newConfig.remote_port,
    newConfig.local_port,
    newConfig.workload_type,
  ])

  const [isFormValid, setIsFormValid] = useState(false)
  const [kubeConfig, setKubeConfig] = useState<string>('default')

  const contextQuery = useQuery<KubeContext[]>(
    ['kube-contexts', kubeConfig],
    () => fetchKubeContexts(kubeConfig),
    {
      enabled: isModalOpen,
    },
  )

  const handleSetKubeConfig = async () => {
    try {
      await invoke('open_save_dialog')
      const selectedPath = await open({
        multiple: false,
        filters: [],
      })

      await invoke('close_save_dialog')
      if (selectedPath) {
        const filePath = Array.isArray(selectedPath)
          ? selectedPath[0]
          : selectedPath

        setKubeConfig(filePath ?? 'default')
      } else {
        console.log('No file selected')
      }
    } catch (error) {
      console.error('Error selecting a file: ', error)
      setKubeConfig('default')
    }
  }

  const namespaceQuery = useQuery(
    ['kube-namespaces', newConfig.context],
    () => {
      console.log('Invoking namespaces with:', newConfig.context)

      return invoke<{ name: string }[]>('list_namespaces', {
        contextName: newConfig.context,
        kubeconfig: kubeConfig,
      })
    },
    {
      initialData: configData?.namespace,
      enabled: !!newConfig.context,
    },
  )

  const serviceQuery = useQuery(
    ['kube-services', newConfig.context, newConfig.namespace],
    () => {
      console.log('Invoking list_services with:', newConfig)

      return invoke<{ name: string }[]>('list_services', {
        contextName: newConfig.context,
        namespace: newConfig.namespace,
        kubeconfig: kubeConfig,
      })
    },
    {
      initialData: configData?.service,
      enabled:
        !!newConfig.context &&
        !!newConfig.namespace &&
        newConfig.workload_type !== 'proxy',
    },
  )

  const portQuery = useQuery(
    [
      'kube-service-ports',
      newConfig.context,
      newConfig.namespace,
      newConfig.service,
    ],
    () => {
      console.log('Invoking list_service_ports with:', newConfig)

      return invoke<{ name: string; port: number }[]>('list_service_ports', {
        contextName: newConfig.context,
        namespace: newConfig.namespace,
        serviceName: newConfig.service,
        kubeconfig: kubeConfig,
      })
    },
    {
      initialData:
        configData?.ports?.map(port => ({
          name: port.name ?? 'default', // Provide a default name if undefined
          port: port.port,
        })) ?? [],
      enabled:
        !!newConfig.context &&
        !!newConfig.namespace &&
        !!newConfig.service &&
        newConfig.workload_type !== 'proxy',
      onSuccess: ports => {
        console.log('Ports fetched successfully:', ports)
      },
      onError: error => {
        assertIsError(error)
        console.error(
          'Error fetching service ports:',
          error instanceof Error ? error.message : error,
        )
      },
    },
  )

  useEffect(() => {
    if (isEdit && isModalOpen) {
      setSelectedWorkloadType(
        newConfig.workload_type
          ? { label: newConfig.workload_type, value: newConfig.workload_type }
          : null,
      )
      setSelectedProtocol(
        newConfig.protocol
          ? { label: newConfig.protocol, value: newConfig.protocol }
          : null,
      )
      setSelectedContext(
        newConfig.context
          ? { label: newConfig.context, value: newConfig.context }
          : null,
      )
      setSelectedNamespace(
        newConfig.namespace
          ? { label: newConfig.namespace, value: newConfig.namespace }
          : null,
      )
      setSelectedService(
        newConfig.service
          ? { label: newConfig.service, value: newConfig.service }
          : null,
      )
      // Corrected part: Set selectedPort based on newConfig.remote_port
      setSelectedPort(
        newConfig.remote_port
          ? {
            label: newConfig.remote_port.toString(),
            value: newConfig.remote_port,
          }
          : null,
      )
      setKubeConfig(newConfig.kubeconfig ?? 'default')
    }
  }, [
    isEdit,
    isModalOpen,
    newConfig.context,
    newConfig.namespace,
    newConfig.service,
    newConfig.protocol,
    newConfig.remote_port,
    newConfig.workload_type,
    newConfig.kubeconfig,
  ])

  useEffect(() => {
    if (!isModalOpen) {
      resetState()
    }
  }, [isModalOpen])

  const resetState = () => {
    setSelectedContext(null)
    setSelectedNamespace(null)
    setSelectedService(null)
    setSelectedPort(null)
    setSelectedWorkloadType(null)
    setSelectedProtocol(null)
    setKubeConfig('default')
  }

  const handleSelectChange = (
    selectedOption: Option | null,
    { name }: ActionMeta<Option>,
  ) => {
    switch (name) {
    case 'context':
      setSelectedContext(selectedOption)
      if (
        !selectedOption ||
          selectedContext?.value !== selectedOption?.value
      ) {
        setSelectedNamespace(null)
        setSelectedService(null)
        setSelectedPort(null)
        handleInputChange({
          target: { name: 'namespace', value: '' },
        } as unknown as React.ChangeEvent<HTMLInputElement>)
        handleInputChange({
          target: { name: 'service', value: '' },
        } as unknown as React.ChangeEvent<HTMLInputElement>)
        handleInputChange({
          target: { name: 'remote_port', value: '' },
        } as unknown as React.ChangeEvent<HTMLInputElement>)
      }
      break
    case 'namespace':
      setSelectedNamespace(selectedOption)
      if (
        !selectedOption ||
          selectedNamespace?.value !== selectedOption?.value
      ) {
        setSelectedService(null)
        setSelectedPort(null)
        handleInputChange({
          target: { name: 'service', value: '' },
        } as unknown as React.ChangeEvent<HTMLInputElement>)
        handleInputChange({
          target: { name: 'remote_port', value: '' },
        } as unknown as React.ChangeEvent<HTMLInputElement>)
      }
      break
    case 'service':
      setSelectedService(selectedOption)
      if (
        !selectedOption ||
          selectedService?.value !== selectedOption?.value
      ) {
        setSelectedPort(null)
        handleInputChange({
          target: { name: 'remote_port', value: '' },
        } as unknown as React.ChangeEvent<HTMLInputElement>)
      }
      break
    case 'remote_port':
      setSelectedPort(selectedOption)
      break
    case 'workload_type':
      setSelectedWorkloadType(selectedOption)
      break
    case 'protocol':
      setSelectedProtocol(selectedOption)
      break
    }

    handleInputChange({
      target: {
        name: name as string,
        value: selectedOption ? selectedOption.value : '',
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>)
  }

  useEffect(() => {
    if (setNewConfig) {
      // Check if setNewConfig is not undefined
      setNewConfig((prevConfig: Config) => ({
        ...prevConfig,
        kubeconfig: kubeConfig ?? '',
      }))
    }
  }, [kubeConfig, setNewConfig])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()

    const configToSave = {
      ...newConfig,
      kubeconfig: kubeConfig ?? '',
    }

    await handleSaveConfig(configToSave)

    if (!isEdit) {
      resetState()
    }
    closeModal()
  }

  const handleCancel = () => {
    closeModal()
    resetState()
  }

  return (
    <Center>
      <Modal isOpen={isModalOpen} onClose={handleCancel} size='sm'>
        <ModalOverlay bg='transparent' />
        <ModalContent bg='transparent' borderRadius='20px' marginTop='4'>
          <ModalBody p={0}>
            <form onSubmit={handleSave}>
              <VStack
                spacing={3}
                align='stretch'
                p={4}
                border='1px'
                borderColor='gray.700'
                borderRadius='20px'
                bg='gray.800'
                boxShadow={`
				/* Inset shadow for top & bottom inner border effect using dark gray */
				inset 0 2px 6px rgba(0, 0, 0, 0.6),
				inset 0 -2px 6px rgba(0, 0, 0, 0.6),
				/* Inset shadow for an inner border all around using dark gray */
				inset 0 0 0 4px rgba(45, 60, 81, 0.9)
			  `}
              >
                <Flex justifyContent='space-between' alignItems='center'>
                  <Text fontSize='sm' fontWeight='bold'>
                    {isEdit ? 'Edit Configuration' : 'Add Configuration'}
                  </Text>
                  <Button
                    size='xs'
                    height='26px'
                    width='35%'
                    variant='outline'
                    onClick={handleSetKubeConfig}
                    px={4}
                    borderColor='gray.600'
                  >
                    <Tooltip
                      label={`Current kubeconfig: ${kubeConfig}`}
                      aria-label='Kubeconfig Details'
                      placement='top'
                      hasArrow
                    >
                      <Flex align='center'>
                        <Text fontSize='10px' mr={2}>
                          Set Kubeconfig
                        </Text>
                        <InfoIcon color='gray.500' w={2} h={2} />
                      </Flex>
                    </Tooltip>
                  </Button>
                </Flex>
                <Divider />
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel htmlFor='alias' fontSize='12px' mb='-0.4'>
                      Alias
                    </FormLabel>
                    <Input
                      id='alias'
                      type='text'
                      value={newConfig.alias || ''}
                      name='alias'
                      onChange={handleInputChange}
                      size='xs'
                      borderRadius='4px'
                      height='25px'
                    />
                    <Checkbox
                      size='sm'
                      isChecked={newConfig.domain_enabled || false}
                      onChange={e =>
                        handleInputChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked,
                          },
                        } as unknown as React.ChangeEvent<HTMLInputElement>)
                      }
                      mt={1}
                      ml={0.5}
                      name='domain_enabled'
                    >
                      <Text fontSize='10px'>Enable alias as domain</Text>
                    </Checkbox>
                  </FormControl>
                  <FormControl isRequired mt='0.4'>
                    <FormLabel htmlFor='context' fontSize='12px' mb='0'>
                      Context
                    </FormLabel>
                    <ReactSelect
                      styles={customStyles}
                      name='context'
                      options={contextQuery.data?.map(context => ({
                        label: context.name,
                        value: context.name,
                      }))}
                      value={selectedContext}
                      onChange={selectedOption =>
                        handleSelectChange(
                          selectedOption as Option,
                          { name: 'context' } as ActionMeta<Option>,
                        )
                      }
                      menuPlacement='auto'
                      theme={theme => ({
                        ...theme,
                        borderRadius: 4,
                        colors: {
                          ...theme.colors,
                          primary25: 'lightgrey',
                          primary: 'grey',
                        },
                      })}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={2} spacing={3}>
                  <FormControl isRequired>
                    <FormLabel htmlFor='workload_type' fontSize='12px' mb='0'>
                      Workload Type
                    </FormLabel>
                    <ReactSelect
                      styles={customStyles}
                      name='workload_type'
                      options={[
                        { label: 'service', value: 'service' },
                        { label: 'proxy', value: 'proxy' },
                      ]}
                      value={selectedWorkloadType}
                      onChange={selectedOption =>
                        handleSelectChange(
                          selectedOption as Option,
                          { name: 'workload_type' } as ActionMeta<Option>,
                        )
                      }
                      isSearchable={false}
                      menuPlacement='auto'
                      theme={theme => ({
                        ...theme,
                        borderRadius: 4,
                        colors: {
                          ...theme.colors,
                          primary25: 'lightgrey',
                          primary: 'grey',
                        },
                      })}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel htmlFor='namespace' fontSize='12px' mb='0'>
                      Namespace
                    </FormLabel>
                    <ReactSelect
                      styles={customStyles}
                      name='namespace'
                      options={namespaceQuery.data?.map(namespace => ({
                        label: namespace.name,
                        value: namespace.name,
                      }))}
                      value={selectedNamespace}
                      onChange={selectedOption =>
                        handleSelectChange(
                          selectedOption as Option,
                          { name: 'namespace' } as ActionMeta<Option>,
                        )
                      }
                      menuPlacement='auto'
                      theme={theme => ({
                        ...theme,
                        borderRadius: 4,
                        colors: {
                          ...theme.colors,
                          primary25: 'lightgrey',
                          primary: 'grey',
                        },
                      })}
                    />
                  </FormControl>
                </SimpleGrid>

                {newConfig.workload_type?.startsWith('proxy') ? (
                  <>
                    <SimpleGrid columns={2} spacing={3} mt='2'>
                      <FormControl>
                        <FormLabel
                          htmlFor='remote_address'
                          fontSize='12px'
                          mb='0'
                        >
                          Remote Address
                        </FormLabel>
                        <Input
                          id='remote_address'
                          type='text'
                          value={newConfig.remote_address || ''}
                          name='remote_address'
                          onChange={handleInputChange}
                          size='xs'
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel htmlFor='protocol' fontSize='12px' mb='0'>
                          Protocol
                        </FormLabel>
                        <ReactSelect
                          styles={customStyles}
                          name='protocol'
                          options={[
                            { label: 'udp', value: 'udp' },
                            { label: 'tcp', value: 'tcp' },
                          ]}
                          value={selectedProtocol}
                          onChange={selectedOption =>
                            handleSelectChange(
                              selectedOption as Option,
                              { name: 'protocol' } as ActionMeta<Option>,
                            )
                          }
                        />
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={2} spacing={3} mt='2'>
                      <FormControl isRequired>
                        <FormLabel htmlFor='remote_port' fontSize='12px' mb='0'>
                          Target Port
                        </FormLabel>
                        <Input
                          id='remote_port'
                          type='number'
                          value={newConfig.remote_port || ''}
                          name='remote_port'
                          onChange={handleInputChange}
                          size='xs'
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel htmlFor='local_port' fontSize='12px' mb='0'>
                          Local Port
                        </FormLabel>
                        <Input
                          id='local_port'
                          type='number'
                          value={newConfig.local_port || ''}
                          name='local_port'
                          onChange={handleInputChange}
                          size='xs'
                        />
                      </FormControl>
                    </SimpleGrid>
                  </>
                ) : (
                  <>
                    <SimpleGrid columns={2} spacing={3} mt='2'>
                      <FormControl>
                        <FormLabel htmlFor='service' fontSize='12px' mb='0'>
                          Service
                        </FormLabel>
                        <ReactSelect
                          styles={customStyles}
                          name='service'
                          options={serviceQuery.data?.map(service => ({
                            label: service.name,
                            value: service.name,
                          }))}
                          value={selectedService}
                          onChange={selectedOption =>
                            handleSelectChange(
                              selectedOption as Option,
                              { name: 'service' } as ActionMeta<Option>,
                            )
                          }
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel htmlFor='protocol' fontSize='12px' mb='0'>
                          Protocol
                        </FormLabel>
                        <ReactSelect
                          styles={customStyles}
                          name='protocol'
                          options={[
                            { label: 'udp', value: 'udp' },
                            { label: 'tcp', value: 'tcp' },
                          ]}
                          value={selectedProtocol}
                          onChange={selectedOption =>
                            handleSelectChange(
                              selectedOption as Option,
                              { name: 'protocol' } as ActionMeta<Option>,
                            )
                          }
                        />
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={2} spacing={3} mt='2'>
                      <FormControl isRequired>
                        <FormLabel htmlFor='remote_port' fontSize='12px' mb='0'>
                          Target Port
                        </FormLabel>
                        <ReactSelect
                          styles={customStyles}
                          name='remote_port'
                          options={portQuery.data?.map(port => ({
                            label: `${port.port ? port.port + ' - ' : ''}${port.name}`,
                            value: port.port,
                          }))}
                          value={
                            selectedPort
                              ? {
                                label: selectedPort.label,
                                value: selectedPort.value,
                              }
                              : null
                          }
                          onChange={selectedOption =>
                            handleSelectChange(
                              selectedOption as Option,
                              { name: 'remote_port' } as ActionMeta<Option>,
                            )
                          }
                          menuPlacement='auto'
                          theme={theme => ({
                            ...theme,
                            borderRadius: 4,
                            colors: {
                              ...theme.colors,
                              primary25: 'lightgrey',
                              primary: 'grey',
                            },
                          })}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel
                          htmlFor='local_port'
                          fontSize='12px'
                          mb='-0.6'
                        >
                          Local Port
                        </FormLabel>
                        <Input
                          id='local_port'
                          type='number'
                          value={newConfig.local_port || ''}
                          name='local_port'
                          onChange={handleInputChange}
                          size='xs'
                          borderRadius='4px'
                          height='26px'
                          borderColor='gray.600'
                        />
                      </FormControl>
                    </SimpleGrid>
                  </>
                )}
                <SimpleGrid columns={2} spacing={3} mt='1'>
                  <FormControl mt='0'>
                    <Checkbox
                      size='sm'
                      isChecked={isChecked}
                      onChange={handleCheckboxChange}
                      mt={1.5}
                    >
                      <Text fontSize='12px'>Local Address</Text>
                    </Checkbox>
                    <Input
                      id='local_address'
                      isDisabled={!isChecked}
                      value={newConfig.local_address || '127.0.0.1'}
                      type='text'
                      name='local_address'
                      onChange={handleInputChange}
                      size='xs'
                      borderRadius='4px'
                      height='26px'
                      borderColor='gray.600'
                    />
                  </FormControl>
                </SimpleGrid>

                <Flex justifyContent='flex-end' pt={4} width='100%'>
                  <Button
                    onClick={handleCancel}
                    size='xs'
                    height='20px'
                    variant='outline'
                    mr={2}
                  >
                    Cancel
                  </Button>
                  <Button
                    height='20px'
                    type='submit'
                    colorScheme='blue'
                    size='xs'
                    isDisabled={!isFormValid}
                  >
                    {isEdit ? 'Save Changes' : 'Add Config'}
                  </Button>
                </Flex>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Center>
  )
}

export default AddConfigModal
