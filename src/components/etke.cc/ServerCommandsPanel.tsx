import { useEffect, useState } from "react";
import { Button, Loading, useDataProvider, useCreatePath, useStore } from "react-admin";
import { useAppContext } from "../../Context";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, TextField, Box } from "@mui/material";
import { PlayArrow, CheckCircle } from "@mui/icons-material";
import { Icons } from "../../utils/icons";
import { ServerCommand, ServerProcessResponse } from "../../synapse/dataProvider";
import { Link } from 'react-router-dom';


const renderIcon = (icon: string) => {
  const IconComponent = Icons[icon] as React.ComponentType<any> | undefined;
  return IconComponent ? <IconComponent sx={{ verticalAlign: "middle", mr: 1 }} /> : null;
}

const ServerCommandsPanel = () => {
  const { etkeccAdmin } = useAppContext();
  const createPath = useCreatePath();

  const [ isLoading, setLoading ] = useState(true);
    const [serverCommands, setServerCommands] = useState<{ [key: string]: ServerCommand }>({});
    const [serverProcess, setServerProcess] = useStore<ServerProcessResponse>("serverProcess", { command: "", locked_at: "" });
    const [commandIsRunning, setCommandIsRunning] = useState<boolean>(false);
    const [commandResult, setCommandResult] = useState<any[]>([]);

    const dataProvider = useDataProvider();

    useEffect(() => {
      const fetchIsAdmin = async () => {
        const serverCommandsResponse = await dataProvider.getServerCommands(etkeccAdmin);
        if (serverCommandsResponse) {
          const serverCommands = serverCommandsResponse;
          Object.keys(serverCommandsResponse).forEach((command: string) => {
            serverCommands[command].additionalArgs = "";
          });
          setServerCommands(serverCommands);
        }
        setLoading(false);
      }
      fetchIsAdmin();
    }, []);

    useEffect(() => {
      if (serverProcess.command === "") {
        setCommandIsRunning(false);
      }
    }, [serverProcess]);

    const setCommandAdditionalArgs = (command: string, additionalArgs: string) => {
      const updatedServerCommands = {...serverCommands};
      updatedServerCommands[command].additionalArgs = additionalArgs;
      setServerCommands(updatedServerCommands);
    }

    const runCommand = async (command: string) => {
      setCommandResult([]);
      setCommandIsRunning(true);

      const additionalArgs = serverCommands[command].additionalArgs;
      const response = await dataProvider.runServerCommand(etkeccAdmin, command, { ...(additionalArgs && { args: additionalArgs }) });

      if (!response.success) {
        return;
      }

      const updatedServerCommands = {...serverCommands};
      const commandResult: React.ReactNode[] = [];

      let commandScheduledText = `Command scheduled: ${command}`;
      if (serverCommands[command].additionalArgs) {
        commandScheduledText += `, with additional args: ${serverCommands[command].additionalArgs}`;
      }
      commandResult.push(<Box>{commandScheduledText}</Box>);
      commandResult.push(<Box>Expect your result in the <Link to={createPath({ resource: "server_notifications", type: "list" })}>Notifications</Link> page soon.</Box>);

      updatedServerCommands[command].additionalArgs = "";
      setServerCommands(updatedServerCommands);

      setCommandResult(commandResult);

      const serverProcess: ServerProcessResponse = await dataProvider.getServerRunningProcess(etkeccAdmin, true);
      setServerProcess({...serverProcess});
    };

    if (isLoading) {
        return <Loading />
    }

    return (<>
        <h2>Server Commands</h2>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 450 }} size="small" aria-label="simple table">
            <TableHead>
            <TableRow>
              <TableCell>Command</TableCell>
              <TableCell>Description</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(serverCommands).map(([command, { icon, args, description, additionalArgs }]) => (
              <TableRow
                key={command}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell scope="row">
                  <Box>
                    {renderIcon(icon)}
                    {command}
                  </Box>
                </TableCell>
                <TableCell>{description}</TableCell>
                <TableCell>
                  {args && <TextField
                    size="small"
                    variant="standard"
                    onChange={(e) => {
                      setCommandAdditionalArgs(command, e.target.value);
                    }}
                    value={additionalArgs}
                  />}
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    label="Run"
                    startIcon={<PlayArrow />}
                    onClick={() => { runCommand(command); }}
                    disabled={commandIsRunning || (args && typeof additionalArgs === 'string' && additionalArgs.length === 0)}
                  ></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {commandResult.length > 0 && <Alert icon={<CheckCircle fontSize="inherit" />} severity="success">
        {commandResult.map((result, index) => (
          <div key={index}>{result}</div>
        ))}
      </Alert>}
    </>
  )
};

export default ServerCommandsPanel;