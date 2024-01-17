@isTest
public class test_cpqQuickActions {
	
    @isTest()
    static void testNewOp(){
         User u1 = new User(
         ProfileId = [SELECT Id FROM Profile WHERE Name = 'System Administrator'].Id,
         LastName = 'last',
         Email = 'puser000@amamama.com',
         Username = 'puser000@amamama.com' + System.currentTimeMillis(),
         CompanyName = 'TEST',
         Title = 'title',
         Alias = 'alias',
         TimeZoneSidKey = 'America/Los_Angeles',
         EmailEncodingKey = 'UTF-8',
         LanguageLocaleKey = 'en_US',
         LocaleSidKey = 'en_US'  
    );
        insert u1;
        
         User u2 = new User(
         ProfileId = [SELECT Id FROM Profile WHERE Name = 'System Administrator'].Id,
         LastName = 'first',
         Email = 'some@amamama.com',
         Username = 'some@amamama.com' + System.currentTimeMillis(),
         CompanyName = 'TEST',
         Title = 'notes',
         Alias = 'first',
         TimeZoneSidKey = 'America/Los_Angeles',
         EmailEncodingKey = 'UTF-8',
         LanguageLocaleKey = 'en_US',
         LocaleSidKey = 'en_US'  
    );
        insert u2;
        Sales_Rep__c rep = new Sales_Rep__c(
        					   Name='Test Rep',
        					   Sales_Rep_Num__c = '954',
            				   Fiscal_Year__c = 'Sales',
        					   Salesforce_User__c = u1.Id);
        insert rep;
        //insert account
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'Test Customer 123456';
        insert cust;
        
        list<Opportunity> opps = [select id, name from opportunity];
        ApexPages.StandardSetController con = new ApexPages.StandardSetController(opps);
        cpqQuickActions ext = new cpqQuickActions(con);
        
        test.startTest();
        	System.runAs(u1){
                list<sales_rep__c> testMeth = [select id from sales_rep__c where Salesforce_User__c =: u1.id];
                system.debug('testMeth' + testMeth);
                system.debug(u1);
            	PageReference method = ext.newOpp();
					method.getParameters().put('AccountId', '');
            		method.getParameters().put('IsEOP', '0');
            		test.setCurrentPage(method); 
        	}
        	System.runAs(u2){
            	PageReference method2 = ext.newOpp(); 
            	method2.getParameters().put('AccountId', cust.Id);
            	method2.getParameters().put('IsEOP', '1');
            	test.setCurrentPage(method2);
        	}
        
        System.runAs(u1){
            PageReference pageRef = Page.cpqListNewOpp;
            pageRef.getParameters().put('AccountId', '');
            pageRef.getParameters().put('IsEOP', '0');
            test.setCurrentPage(pageRef); 
        }
        
        System.runAs(u2){
            PageReference pageRef = Page.cpqListNewOpp;
            pageRef.getParameters().put('AccountId', cust.Id);
            pageRef.getParameters().put('IsEOP', '1');
            test.setCurrentPage(pageRef);  

        }
        	PageReference willError = ext.newOpp(); 
        test.stopTest();
        //List<Opportunity> repOpp = [select id from opportunity where Sales_Rep__c =: rep.Id];
        //List<Opportunity> noRep = [select id from opportunity where Sales_Rep__c = ''];
        //system.assertEquals(1, repOpp.size());
        //system.assertEquals(2, noRep.size());
    }
   
}