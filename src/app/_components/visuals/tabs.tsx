import {
    Flex,
    Tab,
    TabGroup,
    TabList,
    TabPanel,
    TabPanels,
    Text,
} from "@tremor/react";

export function Tabs({
    tabs,
    title,
}: {
    tabs: { title: string; component: JSX.Element | Promise<JSX.Element> }[];
    title?: string;
}) {
    return (
        <TabGroup>
            <Flex className="flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                <Text className="text-2xl font-bold">{title}</Text>
                <TabList variant="solid">
                    {tabs.map((tab, idx) => (
                        <Tab key={idx}>{tab.title}</Tab>
                    ))}
                </TabList>
            </Flex>
            <TabPanels>
                {tabs.map((tab, idx) => (
                    <TabPanel key={idx}>{tab.component}</TabPanel>
                ))}
            </TabPanels>
        </TabGroup>
    );
}
